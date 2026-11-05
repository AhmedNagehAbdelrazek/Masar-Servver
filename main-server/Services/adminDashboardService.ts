// @ts-nocheck
import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../config/database';
import { TRIP_STATUS, BOOKING_STATUS, COMPLAINT_STATUS, PENALTY_TYPES, VERIFICATION_STATUS } from '../config/constants';
import { parsePagination, buildPagination } from '../utils/pagination';
import { ApiErrors } from '../utils/ApiError';
import { maskPhone } from '../utils/masking';
import { User, DriverProfile, Vehicle, UploadedImage, Trip, Booking, Rating, Complaint, Penalty, DriverSubscription, DocumentReview, VerificationStatusChange } from '../Models';

// ===== Canonical document registry (data-model.md) =====
const DOCUMENT_KEYS = {
  personal_documents: [
    { key: 'id_front', source: 'profile', column: 'userIdentificationFront' },
    { key: 'id_back', source: 'profile', column: 'userIdentificationBack' },
    { key: 'face_photo', source: 'profile', column: 'personalImageWithId' },
    { key: 'license_front', source: 'profile', column: 'linceseFront' },
    { key: 'license_back', source: 'profile', column: 'linceseBack' },
  ],
  vehicle_documents: [
    { key: 'registration_front', source: 'vehicle', column: 'registrationDocFront' },
    { key: 'registration_back', source: 'vehicle', column: 'registrationDocBack' },
    { key: 'insurance', source: null, column: null },
  ],
};

const ALL_DOCUMENT_KEYS = Object.values(DOCUMENT_KEYS).flat();

const DRIVER_STATUSES = ['active', 'suspended', 'pending', 'blocked'];
const STANDING_ACTIONS = ['suspend', 'reactivate', 'unblock'];

const TRIP_ACTIVE_STATUSES = [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL, TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING];

// Derived dashboard status buckets (research R7)
const ACTIVE_BUCKET = {
  role: 'driver',
  status: { [Op.in]: ['active', 'warned'] },
  verificationStatus: VERIFICATION_STATUS.APPROVED,
};
const PENDING_BUCKET = {
  role: 'driver',
  status: { [Op.in]: ['active', 'warned'] },
  verificationStatus: { [Op.in]: [VERIFICATION_STATUS.UNVERIFIED, VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.REJECTED] },
};
const SUSPENDED_BUCKET = { role: 'driver', status: 'suspended' };
const BLOCKED_BUCKET = { role: 'driver', status: 'banned' };

function deriveAccountStatus(user) {
  if (user.status === 'banned') return 'blocked';
  if (user.status === 'suspended') return 'suspended';
  if (Object.values(VERIFICATION_STATUS).includes(user.verificationStatus)
    && user.verificationStatus !== VERIFICATION_STATUS.APPROVED) return 'pending';
  return 'active';
}

function bucketWhereFor(statusFilter) {
  switch (statusFilter) {
    case 'active': return ACTIVE_BUCKET;
    case 'pending': return PENDING_BUCKET;
    case 'suspended': return SUSPENDED_BUCKET;
    case 'blocked': return BLOCKED_BUCKET;
    default: return null;
  }
}

function mapTripStatusFilter(status) {
  switch (status) {
    case 'pending': return { [Op.in]: [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL] };
    case 'active': return { [Op.in]: [TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING] };
    case 'completed': return TRIP_STATUS.COMPLETED;
    case 'canceled':
    case 'cancelled': return TRIP_STATUS.CANCELLED;
    default: return null;
  }
}

async function getDriverOrThrow(driverId) {
  const driver = await User.findByPk(driverId);
  if (!driver || driver.role !== 'driver') throw ApiErrors.notFound('DRIVER_NOT_FOUND');
  return driver;
}

async function loadDossierContext(driverId) {
  const [driver, profile, vehicle] = await Promise.all([
    User.findByPk(driverId),
    DriverProfile.findOne({ where: { driverId } }),
    Vehicle.findOne({ where: { driverId } }),
  ]);
  if (!driver || driver.role !== 'driver') throw ApiErrors.notFound('DRIVER_NOT_FOUND');
  const reviews = await DocumentReview.findAll({ where: { driverId } });
  const reviewByKey = new Map(reviews.map((r) => [r.documentKey, r]));
  return { driver, profile, vehicle, reviewByKey };
}

async function resolveImages(imageIds) {
  const ids = [...new Set(imageIds.filter((v) => v != null))];
  if (ids.length === 0) return new Map();
  const rows = await UploadedImage.findAll({ where: { id: { [Op.in]: ids } } });
  return new Map(rows.map((r) => [r.id, r]));
}

function documentEntry(def, profile, vehicle, reviewByKey, imageMap) {
  const imageId = def.source === 'profile'
    ? profile?.[def.column]
    : def.source === 'vehicle' ? vehicle?.[def.column] : null;
  const image = imageId != null ? imageMap.get(imageId) : null;
  const review = reviewByKey.get(def.key);
  let status;
  if (review) status = review.decision;
  else if (image) status = 'pending';
  else status = 'missing';
  return {
    key: def.key,
    document_url: image ? image.url : null,
    upload_date: image ? image.createdat : null,
    status,
    ...(status === 'rejected' && review?.reason ? { reason: review.reason } : {}),
    ...(def.source == null ? { note: 'not_tracked_yet' } : {}),
  };
}

async function buildDocumentGroups(profile, vehicle, reviewByKey) {
  const imageIds = ALL_DOCUMENT_KEYS.map((d) => (d.source === 'profile'
    ? profile?.[d.column]
    : d.source === 'vehicle' ? vehicle?.[d.column] : null)).filter((v) => v != null);
  const imageMap = await resolveImages(imageIds);
  return {
    personal_documents: DOCUMENT_KEYS.personal_documents.map((d) => documentEntry(d, profile, vehicle, reviewByKey, imageMap)),
    vehicle_documents: DOCUMENT_KEYS.vehicle_documents.map((d) => documentEntry(d, profile, vehicle, reviewByKey, imageMap)),
  };
}

async function pendingDocumentKeysFor(driverIds) {
  if (driverIds.length === 0) return new Map();
  const [profiles, vehicles, reviews] = await Promise.all([
    DriverProfile.findAll({ where: { driverId: { [Op.in]: driverIds } } }),
    Vehicle.findAll({ where: { driverId: { [Op.in]: driverIds } } }),
    DocumentReview.findAll({ where: { driverId: { [Op.in]: driverIds } } }),
  ]);
  const profileByDriver = new Map(profiles.map((p) => [p.driverId, p]));
  const vehicleByDriver = new Map(vehicles.map((v) => [v.driverId, v]));
  const decidedByDriver = new Map();
  for (const r of reviews) {
    if (!decidedByDriver.has(r.driverId)) decidedByDriver.set(r.driverId, new Set());
    decidedByDriver.get(r.driverId).add(r.documentKey);
  }
  const result = new Map();
  for (const id of driverIds) {
    const profile = profileByDriver.get(id);
    const vehicle = vehicleByDriver.get(id);
    const decided = decidedByDriver.get(id) || new Set();
    const keys = [];
    for (const group of Object.values(DOCUMENT_KEYS)) {
      for (const def of group) {
        const value = def.source === 'profile'
          ? profile?.[def.column]
          : def.source === 'vehicle' ? vehicle?.[def.column] : null;
        if (value != null && !decided.has(def.key)) keys.push(def.key);
      }
    }
    result.set(id, keys);
  }
  return result;
}

async function countPendingDocuments() {
  const fileColumns = [
    'user_identification_front', 'user_identification_back', 'personal_image_with_id',
    'lincese_front', 'lincese_back',
  ];
  const vehicleColumns = ['registration_doc_front', 'registration_doc_back'];
  const selects = [
    ...fileColumns.map((c) => `SELECT COUNT(*)::int AS cnt FROM driver_profiles dp JOIN users u ON u.id = dp.driver_id AND u.role = 'driver' WHERE dp.${c} IS NOT NULL`),
    ...vehicleColumns.map((c) => `SELECT COUNT(*)::int AS cnt FROM vehicles v JOIN users u ON u.id = v.driver_id AND u.role = 'driver' WHERE v.${c} IS NOT NULL`),
  ].join(' UNION ALL ');
  const [uploaded] = await sequelize.query(`SELECT SUM(cnt)::int AS total FROM (${selects}) s`);
  const uploadedTotal = Number(uploaded?.[0]?.total || 0);
  const decided = await DocumentReview.count();
  return Math.max(0, uploadedTotal - decided);
}

function tripPassengerAggregates(tripIds) {
  if (tripIds.length === 0) return Promise.resolve(new Map());
  return Booking.findAll({
    attributes: ['tripId', [fn('COUNT', col('id')), 'reservations_count'], [fn('SUM', col('seats_booked')), 'passengers_count']],
    where: { tripId: { [Op.in]: tripIds }, status: { [Op.ne]: BOOKING_STATUS.CANCELLED } },
    group: ['tripId'],
  }).then((rows) => new Map(rows.map((r) => [
    r.tripId,
    { reservations_count: Number(r.get('reservations_count')), passengers_count: Number(r.get('passengers_count') || 0) },
  ])));
}

function recentTripShape(trip, driver, agg) {
  return {
    trip_id: trip.id,
    driver: driver ? { id: driver.id, name: driver.fullName } : null,
    route: { origin: trip.originCity, destination: trip.destinationCity },
    departure_time: trip.departureTime,
    status: trip.status,
    passengers_count: agg?.passengers_count ?? 0,
    reservations_count: agg?.reservations_count ?? 0,
  };
}

async function fetchRecentTrips({ limit, offset = 0, status = null }) {
  const where = {};
  if (status) where.status = mapTripStatusFilter(status) || status;
  const { rows, count } = await Trip.findAndCountAll({
    where,
    include: [{ model: User, as: 'driver', attributes: ['id', 'fullName'] }],
    order: [['departure_time', 'DESC']],
    offset,
    limit,
  });
  const aggs = await tripPassengerAggregates(rows.map((t) => t.id));
  return {
    data: rows.map((t) => recentTripShape(t, t.driver, aggs.get(t.id))),
    pagination: buildPagination(count, Math.floor(offset / limit) + 1, limit),
  };
}

// ===== US1: Global dashboard =====

async function getSummary() {
  const [
    totalDrivers, activeDrivers, totalTrips, activeTrips, totalVehicles,
    pendingDocsCount, pendingDriversRows, unresolvedComplaints,
    topRoutes, recentTripRows, latestComplaints,
  ] = await Promise.all([
    User.count({ where: { role: 'driver' } }),
    User.count({ where: ACTIVE_BUCKET }),
    Trip.count(),
    Trip.count({ where: { status: { [Op.in]: TRIP_ACTIVE_STATUSES } } }),
    Vehicle.count(),
    countPendingDocuments(),
    User.findAll({ where: PENDING_BUCKET, attributes: ['id', 'fullName', 'phone', 'verificationSubmittedAt', 'createdat'], order: [['createdat', 'ASC']], limit: 10 }),
    Complaint.count({ where: { status: { [Op.in]: [COMPLAINT_STATUS.OPEN, COMPLAINT_STATUS.REVIEWING] } } }),
    Trip.findAll({
      attributes: ['originCity', 'destinationCity', [fn('COUNT', col('id')), 'trips_count']],
      group: ['originCity', 'destinationCity'],
      order: [[literal('trips_count'), 'DESC']],
      limit: 5,
    }),
    Trip.findAll({
      where: {},
      include: [{ model: User, as: 'driver', attributes: ['id', 'fullName'] }],
      order: [['departure_time', 'DESC']],
      limit: 5,
    }),
    Complaint.findAll({
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'fullName'] },
        { model: User, as: 'accused', attributes: ['id', 'fullName'] },
      ],
      order: [['createdat', 'DESC']],
      limit: 5,
    }),
  ]);

  const aggs = await tripPassengerAggregates(recentTripRows.map((t) => t.id));
  const pendingDocKeys = await pendingDocumentKeysFor(pendingDriversRows.map((u) => u.id));

  return {
    kpis: {
      total_drivers: totalDrivers,
      active_drivers: activeDrivers,
      total_trips: totalTrips,
      active_trips: activeTrips,
      total_vehicles: totalVehicles,
      pending_documents: pendingDocsCount,
    },
    alerts: [
      { type: 'pending_verification_documents', message: 'ALERT_PENDING_VERIFICATION_DOCUMENTS', count: pendingDocsCount },
      { type: 'pending_review_drivers', message: 'ALERT_PENDING_REVIEW_DRIVERS', count: pendingDriversRows.length >= 10 ? `${pendingDriversRows.length}+` : pendingDriversRows.length },
      { type: 'unresolved_complaints', message: 'ALERT_UNRESOLVED_COMPLAINTS', count: unresolvedComplaints },
    ],
    top_routes: topRoutes.map((r) => ({
      origin: r.originCity,
      destination: r.destinationCity,
      trips_count: Number(r.get('trips_count')),
    })),
    recent_trips: recentTripRows.map((t) => recentTripShape(t, t.driver, aggs.get(t.id))),
    pending_requests: pendingDriversRows.map((u) => ({
      driver_id: u.id,
      name: u.fullName,
      phone: maskPhone(u.phone),
      submitted_at: u.verificationSubmittedAt || u.createdat,
      pending_documents: pendingDocKeys.get(u.id) || [],
    })),
    latest_complaints: latestComplaints.map((c) => ({
      id: c.id,
      complainant: c.reporter ? { id: c.reporter.id, name: c.reporter.fullName } : null,
      accused: c.accused ? { id: c.accused.id, name: c.accused.fullName } : null,
      date: c.createdat,
      subject: c.category,
      status: c.status,
    })),
  };
}

async function getRecentTrips(query) {
  const { page, limit, offset } = parsePagination(query);
  const result = await fetchRecentTrips({ limit, offset, status: query.status || null });
  result.pagination.page = page;
  return result;
}

async function getTopRoutes() {
  const rows = await Trip.findAll({
    attributes: ['originCity', 'destinationCity', [fn('COUNT', col('id')), 'trips_count']],
    group: ['originCity', 'destinationCity'],
    order: [[literal('trips_count'), 'DESC']],
    limit: 5,
  });
  return {
    top_routes: rows.map((r) => ({
      origin: r.originCity,
      destination: r.destinationCity,
      trips_count: Number(r.get('trips_count')),
    })),
  };
}

async function getPendingRequests(query) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, count } = await User.findAndCountAll({
    where: PENDING_BUCKET,
    attributes: ['id', 'fullName', 'phone', 'verificationSubmittedAt', 'createdat'],
    order: [['createdat', 'ASC']],
    offset,
    limit,
  });
  const pendingDocKeys = await pendingDocumentKeysFor(rows.map((u) => u.id));
  return {
    data: rows.map((u) => ({
      driver_id: u.id,
      name: u.fullName,
      phone: maskPhone(u.phone),
      submitted_at: u.verificationSubmittedAt || u.createdat,
      pending_documents: pendingDocKeys.get(u.id) || [],
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function getLatestComplaints(query) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, count } = await Complaint.findAndCountAll({
    include: [
      { model: User, as: 'reporter', attributes: ['id', 'fullName'] },
      { model: User, as: 'accused', attributes: ['id', 'fullName'] },
    ],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });
  return {
    data: rows.map((c) => ({
      id: c.id,
      complainant: c.reporter ? { id: c.reporter.id, name: c.reporter.fullName } : null,
      accused: c.accused ? { id: c.accused.id, name: c.accused.fullName } : null,
      date: c.createdat,
      subject: c.category,
      status: c.status,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

// ===== US2: Drivers directory =====

const SORT_COLUMNS = {
  created_at: 'createdat',
  full_name: 'fullName',
  avg_rating: 'avgRating',
};

async function listDrivers(query) {
  const { page, limit, offset } = parsePagination(query);
  const where = bucketWhereFor(query.status) || { role: 'driver' };

  if (query.search) {
    const term = `%${query.search}%`;
    where[Op.or] = [{ fullName: { [Op.iLike]: term } }, { phone: { [Op.iLike]: term } }];
  }
  if (query.registration_from || query.registration_to) {
    where.createdat = {};
    if (query.registration_from) where.createdat[Op.gte] = new Date(`${query.registration_from}T00:00:00.000Z`);
    if (query.registration_to) {
      const to = new Date(`${query.registration_to}T23:59:59.999Z`);
      where.createdat[Op.lte] = to;
    }
  }

  const sortColumn = SORT_COLUMNS[query.sort_by] || SORT_COLUMNS.created_at;
  const sortOrder = (query.sort_order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: ['id', 'fullName', 'phone', 'avgRating', 'totalBalance', 'status', 'verificationStatus', 'createdat'],
    include: [{ model: DriverProfile, as: 'driverProfile', attributes: ['totalTrips'] }],
    order: [[sortColumn, sortOrder]],
    offset,
    limit,
  });

  return {
    data: rows.map((u) => ({
      id: u.id,
      name: u.fullName,
      phone: maskPhone(u.phone),
      registration_date: u.createdat,
      avg_rating: Number(u.avgRating || 0),
      total_trips: u.driverProfile?.totalTrips ?? 0,
      balance: Number(u.totalBalance || 0),
      account_status: deriveAccountStatus(u),
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function getDriverStats() {
  const [total, active, suspended, pending] = await Promise.all([
    User.count({ where: { role: 'driver' } }),
    User.count({ where: ACTIVE_BUCKET }),
    User.count({ where: SUSPENDED_BUCKET }),
    User.count({ where: PENDING_BUCKET }),
  ]);
  return { total_drivers: total, active_drivers: active, suspended_drivers: suspended, pending_drivers: pending };
}

// ===== US3: Dossier tabs =====

async function getDriverHeader(driverId) {
  const driver = await getDriverOrThrow(driverId);
  const [totalTrips, completedTrips, canceledTrips, reviewsCount, ratingAgg] = await Promise.all([
    Trip.count({ where: { driverId } }),
    Trip.count({ where: { driverId, status: TRIP_STATUS.COMPLETED } }),
    Trip.count({ where: { driverId, status: TRIP_STATUS.CANCELLED } }),
    Rating.count({ where: { rateeId: driverId } }),
    Rating.findOne({ attributes: [[fn('AVG', col('stars')), 'avg']], where: { rateeId: driverId } }),
  ]);
  const computedAvg = ratingAgg?.get('avg') ? parseFloat(ratingAgg.get('avg')) : null;
  return {
    id: driver.id,
    name: driver.fullName,
    phone: maskPhone(driver.phone),
    age: driver.age != null ? Number(driver.age) : null,
    city: null,
    avatar_url: driver.avatarUrl,
    account_status: deriveAccountStatus(driver),
    trip_stats: { total_trips: totalTrips, completed_trips: completedTrips, canceled_trips: canceledTrips },
    balance: Number(driver.totalBalance || 0),
    avg_rating: computedAvg ?? Number(driver.avgRating || 0),
    reviews_count: reviewsCount,
  };
}

async function getDriverOverview(driverId) {
  const driver = await getDriverOrThrow(driverId);
  const [totalTrips, completedTrips, canceledTrips, ratingAgg, subscription] = await Promise.all([
    Trip.count({ where: { driverId } }),
    Trip.count({ where: { driverId, status: TRIP_STATUS.COMPLETED } }),
    Trip.count({ where: { driverId, status: TRIP_STATUS.CANCELLED } }),
    Rating.findOne({ attributes: [[fn('AVG', col('stars')), 'avg']], where: { rateeId: driverId } }),
    DriverSubscription.findOne({ where: { driverId }, order: [['createdat', 'DESC']] }),
  ]);
  const avg = ratingAgg?.get('avg') ? parseFloat(ratingAgg.get('avg')) : Number(driver.avgRating || 0);
  return {
    personal_info: {
      name: driver.fullName,
      phone: maskPhone(driver.phone),
      registration_date: driver.createdat,
      last_login: driver.lastLoginAt,
      city: null,
    },
    trip_statistics: { total_trips: totalTrips, completed_trips: completedTrips, canceled_trips: canceledTrips, avg_rating: avg },
    balance_details: subscription
      ? {
        price_per_month: Number(subscription.planCost),
        duration_days: subscription.planPeriodDays,
        interest_rate: Number(subscription.planPercentageCut),
        start_date: subscription.activatedAt || subscription.createdat,
        end_date: subscription.expiresAt,
      }
      : null,
  };
}

async function listDriverTrips(driverId, query) {
  await getDriverOrThrow(driverId);
  const { page, limit, offset } = parsePagination(query);
  const where = { driverId };
  if (query.status && query.status !== 'all') {
    const mapped = mapTripStatusFilter(query.status);
    if (mapped) where.status = mapped;
  }
  if (query.month) {
    const [y, m] = String(query.month).split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    where.departureTime = { [Op.gte]: start, [Op.lt]: end };
  }
  const { rows, count } = await Trip.findAndCountAll({
    where,
    order: [['departure_time', 'DESC']],
    offset,
    limit,
  });
  const aggs = await tripPassengerAggregates(rows.map((t) => t.id));
  return {
    data: rows.map((t) => ({
      trip_id: t.id,
      route: { origin: t.originCity, destination: t.destinationCity },
      date_time: t.departureTime,
      passengers_count: aggs.get(t.id)?.passengers_count ?? 0,
      reservations_count: aggs.get(t.id)?.reservations_count ?? 0,
      price: Number(t.farePerSeat),
      status: t.status,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function getDriverEvaluations(driverId, query) {
  await getDriverOrThrow(driverId);
  const { page, limit, offset } = parsePagination(query);
  const [summaryRow, distRows, tagRows, { rows, count }] = await Promise.all([
    Rating.findOne({ attributes: [[fn('AVG', col('stars')), 'avg'], [fn('COUNT', col('id')), 'total']], where: { rateeId: driverId } }),
    Rating.findAll({ attributes: ['stars', [fn('COUNT', col('id')), 'cnt']], where: { rateeId: driverId }, group: ['stars'] }),
    Rating.findAll({ attributes: ['tags'], where: { rateeId: driverId, tags: { [Op.ne]: null } } }),
    Rating.findAndCountAll({
      where: { rateeId: driverId },
      include: [{ model: User, as: 'rater', attributes: ['id', 'fullName', 'avatarUrl'] }],
      order: [['createdat', 'DESC']],
      offset,
      limit,
    }),
  ]);
  const countsByStar = new Map(distRows.map((r) => [Number(r.stars), Number(r.get('cnt'))]));
  const tagCounts = new Map();
  for (const row of tagRows) {
    for (const tag of row.tags || []) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  return {
    summary: {
      average_rating: summaryRow?.get('avg') ? parseFloat(summaryRow.get('avg')) : 0,
      total_reviews: Number(summaryRow?.get('total') || 0),
    },
    distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: countsByStar.get(rating) || 0 })),
    top_tags: topTags,
    reviews: rows.map((r) => ({
      passenger_name: r.rater?.fullName || 'Unknown',
      passenger_avatar: r.rater?.avatarUrl || null,
      rating: r.stars,
      comment: r.review,
      was_late: r.wasLate,
      date: r.createdat,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function getAccountLog(driverId) {
  await getDriverOrThrow(driverId);
  const now = new Date();
  const [penalties, complaints] = await Promise.all([
    Penalty.findAll({ where: { userId: driverId }, order: [['starts_at', 'DESC']] }),
    Complaint.findAll({
      where: { [Op.or]: [{ reporterId: driverId }, { accusedId: driverId }] },
      order: [['createdat', 'DESC']],
    }),
  ]);
  const log = [
    ...penalties.map((p) => {
      const open = !p.endsAt && new Date(p.startsAt) <= now;
      return {
        title: p.penaltyType || p.type,
        reason: p.reason,
        related_trip_id: p.tripId || null,
        date: p.startsAt,
        type: p.type,
        status: open ? 'pending' : 'resolved',
      };
    }),
    ...complaints.map((c) => ({
      title: c.category,
      reason: c.description,
      related_trip_id: null,
      date: c.createdat,
      type: 'enquiry',
      status: [COMPLAINT_STATUS.OPEN, COMPLAINT_STATUS.REVIEWING].includes(c.status) ? 'pending' : 'resolved',
      direction: c.reporterId === driverId ? 'by_driver' : 'against_driver',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    summary: {
      violations: penalties.length,
      warnings: penalties.filter((p) => p.type === PENALTY_TYPES.WARNING).length,
      suspensions: penalties.filter((p) => p.type !== PENALTY_TYPES.WARNING).length,
      complaints_against: complaints.filter((c) => c.accusedId === driverId).length,
      complaints_by: complaints.filter((c) => c.reporterId === driverId).length,
    },
    log,
  };
}

async function getCarDetails(driverId) {
  const { vehicle, reviewByKey } = await loadDossierContext(driverId);
  if (!vehicle) return { car_info: null, car_photos: { front: null, rear: null }, document_status: [], vehicle_verified: false };
  const imageMap = await resolveImages([
    vehicle.vehiclePhotoFront,
    vehicle.vehiclePhotoBack,
    vehicle.registrationDocFront,
    vehicle.registrationDocBack,
  ]);
  const front = imageMap.get(vehicle.vehiclePhotoFront);
  const rear = imageMap.get(vehicle.vehiclePhotoBack);
  const defs = DOCUMENT_KEYS.vehicle_documents.filter((d) => d.key.startsWith('registration'));
  const entries = defs.map((d) => documentEntry(d, null, vehicle, reviewByKey, imageMap));
  return {
    car_info: {
      make: vehicle.manufacturer,
      model: vehicle.model,
      year: vehicle.modelYear,
      color: vehicle.color,
      plate_number: vehicle.plateNumber,
      seats: vehicle.seats,
    },
    car_photos: { front: front ? front.url : null, rear: rear ? rear.url : null },
    document_status: entries.map(({ key, status }) => ({ key, status })),
    vehicle_verified: vehicle.isVerified,
  };
}

async function getDocuments(driverId) {
  const { profile, vehicle, reviewByKey } = await loadDossierContext(driverId);
  const groups = await buildDocumentGroups(profile, vehicle, reviewByKey);
  return { personal_documents: groups.personal_documents, vehicle_documents: groups.vehicle_documents };
}

// ===== US4: Actions =====

async function setDriverStatus(adminId, driverId, requestedStatus) {
  const driver = await getDriverOrThrow(driverId);
  if (!DRIVER_STATUSES.includes(requestedStatus)) throw ApiErrors.validation('INVALID_DRIVER_STATUS_VALUE');

  const currentDerived = deriveAccountStatus(driver);
  if (currentDerived === requestedStatus) throw ApiErrors.conflict('DRIVER_ALREADY_IN_STATE');

  const originalVerification = driver.verificationStatus;
  const updates = {};
  if (requestedStatus === 'active') updates.status = 'active';
  if (requestedStatus === 'suspended') updates.status = 'suspended';
  if (requestedStatus === 'blocked') updates.status = 'banned';
  if (requestedStatus === 'pending') {
    updates.status = 'active';
    updates.verificationStatus = VERIFICATION_STATUS.PENDING;
  }

  await driver.update(updates);

  if (updates.verificationStatus && originalVerification !== updates.verificationStatus) {
    await VerificationStatusChange.create({
      driverId,
      fromStatus: originalVerification,
      toStatus: updates.verificationStatus,
      changedBy: adminId,
      reason: 'Set to pending via admin dashboard',
    });
  }

  return { driver: { id: driver.id, account_status: deriveAccountStatus(await driver.reload()) } };
}

async function applyStandingAction(adminId, driverId, action, reason) {
  if (!STANDING_ACTIONS.includes(action)) throw ApiErrors.validation('INVALID_ACCOUNT_ACTION');
  const driver = await getDriverOrThrow(driverId);
  const currentDerived = deriveAccountStatus(driver);

  if (action === 'suspend') {
    if (currentDerived === 'suspended') throw ApiErrors.conflict('DRIVER_ALREADY_IN_STATE');
    await driver.update({ status: 'suspended' });
    await Penalty.create({
      userId: driverId,
      type: PENALTY_TYPES.SUSPENSION,
      penaltyType: 'general',
      severity: 'moderate',
      reason: reason || 'Suspended by administrator from the dashboard',
      issuedBy: adminId,
      startsAt: new Date(),
    });
  } else {
    if (currentDerived === 'active') throw ApiErrors.conflict('DRIVER_ALREADY_IN_STATE');
    await driver.update({ status: 'active' });
    await Penalty.update(
      { endsAt: new Date() },
      { where: { userId: driverId, type: PENALTY_TYPES.SUSPENSION, endsAt: null } }
    );
  }

  return { driver: { id: driver.id, account_status: deriveAccountStatus(await driver.reload()) } };
}

async function decideDocument(adminId, driverId, documentKey, decision, reason) {
  const def = ALL_DOCUMENT_KEYS.find((d) => d.key === documentKey);
  if (!def) throw ApiErrors.badRequest('DOCUMENT_KEY_NOT_RECOGNIZED');
  await getDriverOrThrow(driverId);

  if (!def.source) throw ApiErrors.badRequest('DOCUMENT_HAS_NO_BACKING_FILE');

  const { profile, vehicle } = await loadDossierContext(driverId);
  const imageId = def.source === 'profile' ? profile?.[def.column] : vehicle?.[def.column];
  if (imageId == null) throw ApiErrors.badRequest('DOCUMENT_HAS_NO_BACKING_FILE');

  const [review, created] = await DocumentReview.findOrCreate({
    where: { driverId, documentKey },
    defaults: {
      decision,
      reason: reason || null,
      decidedBy: adminId,
      decidedAt: new Date(),
    },
  });
  if (!created) {
    await review.update({
      decision,
      reason: reason || null,
      decidedBy: adminId,
      decidedAt: new Date(),
    });
  }

  return {
    document: {
      key: documentKey,
      status: decision,
      decided_by: adminId,
      decided_at: review.decidedAt,
      ...(reason ? { reason } : {}),
    },
  };
}

// ===== US5: Shared listings =====

async function listReservations(query) {
  const { page, limit, offset } = parsePagination(query);
  const where = {};
  if (query.status && Object.values(BOOKING_STATUS).includes(query.status)) where.status = query.status;

  const { rows, count } = await Booking.findAndCountAll({
    where,
    include: [
      {
        model: Trip,
        as: 'trip',
        attributes: ['id', 'originCity', 'destinationCity', 'departureTime'],
        include: [{ model: User, as: 'driver', attributes: ['id', 'fullName'] }],
      },
      { model: User, as: 'passenger', attributes: ['id', 'fullName'] },
    ],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });

  return {
    data: rows.map((b) => ({
      reservation_id: b.id,
      reference_code: b.referenceCode,
      driver: b.trip?.driver ? { id: b.trip.driver.id, name: b.trip.driver.fullName } : null,
      passenger: b.passenger ? { id: b.passenger.id, name: b.passenger.fullName } : null,
      trip: b.trip ? {
        id: b.trip.id,
        origin: b.trip.originCity,
        destination: b.trip.destinationCity,
        departure_time: b.trip.departureTime,
      } : null,
      seats_booked: b.seatsBooked,
      price: Number(b.agreedFare),
      currency: b.currency,
      status: b.status,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

module.exports = {
  DOCUMENT_KEYS,
  ALL_DOCUMENT_KEYS,
  deriveAccountStatus,
  getSummary,
  getRecentTrips,
  getTopRoutes,
  getPendingRequests,
  getLatestComplaints,
  listDrivers,
  getDriverStats,
  getDriverHeader,
  getDriverOverview,
  listDriverTrips,
  getDriverEvaluations,
  getAccountLog,
  getCarDetails,
  getDocuments,
  setDriverStatus,
  applyStandingAction,
  decideDocument,
  listReservations,
};
export { DOCUMENT_KEYS, ALL_DOCUMENT_KEYS, deriveAccountStatus, getSummary, getRecentTrips, getTopRoutes, getPendingRequests, getLatestComplaints, listDrivers, getDriverStats, getDriverHeader, getDriverOverview, listDriverTrips, getDriverEvaluations, getAccountLog, getCarDetails, getDocuments, setDriverStatus, applyStandingAction, decideDocument, listReservations };
export default module.exports;