// @ts-nocheck
import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../config/database';
import { TRIP_STATUS, BOOKING_STATUS, COMPLAINT_STATUS, PENALTY_TYPES, VERIFICATION_STATUS } from '../config/constants';
import { parsePagination, buildPagination } from '../utils/pagination';
import { ApiErrors } from '../utils/ApiError';
import { maskPhone } from '../utils/masking';
import { daysAgo, percentChange } from '../utils/statChange';
import { User, DriverProfile, Vehicle, UploadedImage, Trip, TripStop, Booking, Rating, Complaint, Penalty, DriverSubscription, DocumentReview, VerificationStatusChange, Notification, TripSeat, RideRequest, DeletionRequest } from '../Models';
import notificationService from './notificationService';
import { toAbsoluteMediaUrl } from '../utils/mediaUrl';

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

function startOfUtcDay(offsetDays = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

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
const DELETION_REQUEST_STATUSES = ['pending', 'approved'];

// Accounts that asked to be deleted are no longer shown as normal drivers.
// The row stays in the database until the deletion workflow is reviewed.
async function pendingDeletionDriverIds() {
  const rows = await DeletionRequest.findAll({
    where: { status: { [Op.in]: DELETION_REQUEST_STATUSES } },
    attributes: ['userId'],
    raw: true,
  });
  return rows.map((row) => row.userId).filter(Boolean);
}

function notPendingDeletion(ids) {
  return ids.length ? { id: { [Op.notIn]: ids } } : {};
}

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
    case 'abandoned': return TRIP_STATUS.ABANDONED;
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
    document_url: toAbsoluteMediaUrl(image ? image.url : null),
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
  const documentSources = [
    { table: 'driver_profiles', alias: 'dp', column: 'user_identification_front', key: 'id_front' },
    { table: 'driver_profiles', alias: 'dp', column: 'user_identification_back', key: 'id_back' },
    { table: 'driver_profiles', alias: 'dp', column: 'personal_image_with_id', key: 'face_photo' },
    { table: 'driver_profiles', alias: 'dp', column: 'lincese_front', key: 'license_front' },
    { table: 'driver_profiles', alias: 'dp', column: 'lincese_back', key: 'license_back' },
    { table: 'vehicles', alias: 'v', column: 'registration_doc_front', key: 'registration_front' },
    { table: 'vehicles', alias: 'v', column: 'registration_doc_back', key: 'registration_back' },
  ];
  const selects = documentSources.map(({ table, alias, column, key }) => (
    `SELECT COUNT(*)::int AS cnt
       FROM ${table} ${alias}
       JOIN users u ON u.id = ${alias}.driver_id AND u.role = 'driver'
       LEFT JOIN document_reviews dr
         ON dr.driver_id = ${alias}.driver_id AND dr.document_key = '${key}'
      WHERE ${alias}.${column} IS NOT NULL AND dr.id IS NULL`
  )).join(' UNION ALL ');
  const [rows] = await sequelize.query(`SELECT COALESCE(SUM(cnt), 0)::int AS total FROM (${selects}) s`);
  return Number(rows?.[0]?.total || 0);
}

function tripPassengerAggregates(tripIds) {
  if (tripIds.length === 0) return Promise.resolve(new Map());
  return Booking.findAll({
    attributes: ['tripId', 'seatsBooked', 'agreedFare'],
    where: { tripId: { [Op.in]: tripIds }, status: { [Op.ne]: BOOKING_STATUS.CANCELLED } },
    raw: true,
  }).then((rows) => {
    const aggregates = new Map();
    for (const row of rows) {
      const current = aggregates.get(row.tripId) || {
        reservations_count: 0,
        passengers_count: 0,
        total_booking_value: 0,
      };
      current.reservations_count += 1;
      current.passengers_count += Number(row.seatsBooked || 0);
      current.total_booking_value += Number(row.agreedFare || 0) * Number(row.seatsBooked || 0);
      aggregates.set(row.tripId, current);
    }
    return aggregates;
  });
}

function recentTripShape(trip, driver, agg) {
  return {
    trip_id: trip.id,
    driver: driver ? { id: driver.id, name: driver.fullName } : null,
    route: { origin: trip.originCity, destination: trip.destinationCity },
    departure_time: trip.departureTime,
    status: trip.status,
    total_seats: Number(trip.totalSeats),
    available_seats: Number(trip.availableSeats),
    seat_price: Number(trip.farePerSeat),
    trip_type: trip.isRecurring ? 'متكرر' : 'فردية',
    total_booking_value: agg?.total_booking_value ?? 0,
    passengers_count: agg?.passengers_count ?? 0,
    reservations_count: agg?.reservations_count ?? 0,
  };
}

async function fetchRecentTrips({ limit, offset = 0, status = null, search = null }) {
  const where = {};
  if (status) where.status = mapTripStatusFilter(status) || status;
  if (search) {
    where[Op.or] = [
      { originCity: { [Op.iLike]: `%${search}%` } },
      { destinationCity: { [Op.iLike]: `%${search}%` } },
      { '$driver.fullName$': { [Op.iLike]: `%${search}%` } },
    ];
  }
  const { rows, count } = await Trip.findAndCountAll({
    where,
    include: [{ model: User, as: 'driver', attributes: ['id', 'fullName'] }],
    order: [['departure_time', 'DESC']],
    offset,
    limit,
    subQuery: false,
  });
  const aggs = await tripPassengerAggregates(rows.map((t) => t.id));
  return {
    data: rows.map((t) => recentTripShape(t, t.driver, aggs.get(t.id))),
    pagination: buildPagination(count, Math.floor(offset / limit) + 1, limit),
  };
}

// ===== US1: Global dashboard =====

async function getSummary() {
  const deletionIds = await pendingDeletionDriverIds();
  const excludeDeletion = notPendingDeletion(deletionIds);
  const [
    totalDrivers, activeDrivers, totalTrips, activeTrips, totalVehicles,
    pendingDocsCount, pendingDriversCount, pendingDriversRows, unresolvedComplaints,
    topRoutes, recentTripRows, latestComplaints,
    bookingsToday, tripsToday, totalPassengers, pendingPayments, newRideRequests,
    completedTrips, cancelledTrips, upcomingTrips, inProgressTrips, abandonedTrips,
  ] = await Promise.all([
    User.count({ where: { role: 'driver', ...excludeDeletion } }),
    User.count({ where: { ...ACTIVE_BUCKET, ...excludeDeletion } }),
    Trip.count(),
    Trip.count({ where: { status: { [Op.in]: TRIP_ACTIVE_STATUSES } } }),
    Vehicle.count(),
    countPendingDocuments(),
    User.count({ where: { ...PENDING_BUCKET, ...excludeDeletion } }),
    User.findAll({ where: { ...PENDING_BUCKET, ...excludeDeletion }, attributes: ['id', 'fullName', 'phone', 'verificationSubmittedAt', 'createdat'], order: [['createdat', 'ASC']], limit: 10 }),
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
    Booking.count({ where: { createdat: { [Op.gte]: startOfUtcDay() } } }),
    Trip.count({ where: { departureTime: { [Op.gte]: startOfUtcDay(), [Op.lt]: startOfUtcDay(1) } } }),
    User.count({ where: { role: 'passenger' } }),
    DriverSubscription.count({ where: { status: 'pending_approval' } }),
    RideRequest.count({ where: { status: 'open' } }),
    Trip.count({ where: { status: TRIP_STATUS.COMPLETED } }),
    Trip.count({ where: { status: TRIP_STATUS.CANCELLED } }),
    Trip.count({ where: { status: { [Op.in]: [TRIP_STATUS.PUBLISHED, TRIP_STATUS.FULL] } } }),
    Trip.count({ where: { status: { [Op.in]: [TRIP_STATUS.IN_PROGRESS, TRIP_STATUS.ONGOING] } } }),
    Trip.count({ where: { status: TRIP_STATUS.ABANDONED } }),
  ]);

  const aggs = await tripPassengerAggregates(recentTripRows.map((t) => t.id));
  const pendingDocKeys = await pendingDocumentKeysFor(pendingDriversRows.map((u) => u.id));

  const cutoff = daysAgo(7);
  const yesterdayStart = startOfUtcDay(-1);
  const todayStart = startOfUtcDay();
  const [
    driversBefore, passengersBefore, tripsYesterday, bookingsYesterday,
    totalTripsBefore, completedTripsBefore,
  ] = await Promise.all([
    User.count({ where: { role: 'driver', createdat: { [Op.lte]: cutoff }, ...excludeDeletion } }),
    User.count({ where: { role: 'passenger', createdat: { [Op.lte]: cutoff } } }),
    Trip.count({ where: { departureTime: { [Op.gte]: yesterdayStart, [Op.lt]: todayStart } } }),
    Booking.count({ where: { createdat: { [Op.gte]: yesterdayStart, [Op.lt]: todayStart } } }),
    Trip.count({ where: { createdat: { [Op.lte]: cutoff } } }),
    Trip.count({ where: { status: TRIP_STATUS.COMPLETED, completedAt: { [Op.lte]: cutoff } } }),
  ]);
  const kpiChanges = {
    total_drivers: percentChange(totalDrivers, driversBefore),
    total_passengers: percentChange(totalPassengers, passengersBefore),
    trips_today: percentChange(tripsToday, tripsYesterday),
    bookings_today: percentChange(bookingsToday, bookingsYesterday),
    total_trips: percentChange(totalTrips, totalTripsBefore),
    completed_trips: percentChange(completedTrips, completedTripsBefore),
  };

  return {
    kpis: {
      total_drivers: totalDrivers,
      active_drivers: activeDrivers,
      total_trips: totalTrips,
      active_trips: activeTrips,
      total_vehicles: totalVehicles,
      pending_documents: pendingDocsCount,
      pending_drivers: pendingDriversCount,
      bookings_today: bookingsToday,
      trips_today: tripsToday,
      total_passengers: totalPassengers,
      pending_payments: pendingPayments,
      new_ride_requests: newRideRequests,
      completed_trips: completedTrips,
      cancelled_trips: cancelledTrips,
      upcoming_trips: upcomingTrips,
      in_progress_trips: inProgressTrips,
      abandoned_trips: abandonedTrips,
    },
    kpi_changes: kpiChanges,
    alerts: [
      { type: 'pending_verification_documents', message: 'ALERT_PENDING_VERIFICATION_DOCUMENTS', count: pendingDocsCount },
      { type: 'pending_review_drivers', message: 'ALERT_PENDING_REVIEW_DRIVERS', count: pendingDriversCount },
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
  const result = await fetchRecentTrips({
    limit,
    offset,
    status: query.status || null,
    search: query.search || null,
  });
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
  const deletionIds = await pendingDeletionDriverIds();
  const where = {
    ...(bucketWhereFor(query.status) || { role: 'driver' }),
    ...notPendingDeletion(deletionIds),
  };

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
    order: [[sortColumn, sortOrder]],
    offset,
    limit,
  });

  const ids = rows.map((u) => u.id);
  const tripCounts = ids.length
    ? await Trip.findAll({
      attributes: ['driverId', [fn('COUNT', col('id')), 'count']],
      where: { driverId: { [Op.in]: ids } },
      group: ['driverId'],
      raw: true,
    })
    : [];
  const tripCountByDriver = new Map(tripCounts.map((row) => [row.driverId, Number(row.count)]));
  const completedTripCounts = ids.length
    ? await Trip.findAll({
      attributes: ['driverId', [fn('COUNT', col('id')), 'count']],
      where: { driverId: { [Op.in]: ids }, status: TRIP_STATUS.COMPLETED },
      group: ['driverId'],
      raw: true,
    })
    : [];
  const completedTripCountByDriver = new Map(
    completedTripCounts.map((row) => [row.driverId, Number(row.count)]),
  );
  const subscriptions = ids.length
    ? await DriverSubscription.findAll({
      attributes: ['driverId', 'planName'],
      where: { driverId: { [Op.in]: ids }, status: 'active' },
      order: [['createdat', 'DESC']],
      raw: true,
    })
    : [];
  const planByDriver = new Map();
  for (const subscription of subscriptions) {
    if (!planByDriver.has(subscription.driverId)) {
      planByDriver.set(subscription.driverId, subscription.planName);
    }
  }

  const profiles = ids.length
    ? await DriverProfile.findAll({
      attributes: ['driverId'],
      where: { driverId: { [Op.in]: ids } },
      raw: true,
    })
    : [];
  const profileSet = new Set(profiles.map((row) => row.driverId));
  const vehicles = ids.length
    ? await Vehicle.findAll({
      attributes: ['driverId'],
      where: { driverId: { [Op.in]: ids } },
      raw: true,
    })
    : [];
  const vehicleSet = new Set(vehicles.map((row) => row.driverId));

  return {
    data: rows.map((u) => {
      const missing = [];
      if (!u.fullName || !String(u.fullName).trim()) missing.push('name');
      if (!profileSet.has(u.id)) missing.push('profile');
      if (!vehicleSet.has(u.id)) missing.push('vehicle');
      return {
        id: u.id,
        name: u.fullName,
        phone: maskPhone(u.phone),
        phone_full: u.phone,
        registration_date: u.createdat,
        avg_rating: Number(u.avgRating || 0),
        total_trips: tripCountByDriver.get(u.id) ?? 0,
        completed_trips: completedTripCountByDriver.get(u.id) ?? 0,
        plan_name: planByDriver.get(u.id) || null,
        balance: Number(u.totalBalance || 0),
        account_status: deriveAccountStatus(u),
        signup_completed: missing.length === 0,
        signup_missing: missing,
      };
    }),
    pagination: buildPagination(count, page, limit),
  };
}

async function getDriverStats() {
  const deletionIds = await pendingDeletionDriverIds();
  const exclude = notPendingDeletion(deletionIds);
  const [total, active, suspended, pending] = await Promise.all([
    User.count({ where: { role: 'driver', ...exclude } }),
    User.count({ where: { ...ACTIVE_BUCKET, ...exclude } }),
    User.count({ where: { ...SUSPENDED_BUCKET, ...exclude } }),
    User.count({ where: { ...PENDING_BUCKET, ...exclude } }),
  ]);
  return { total_drivers: total, active_drivers: active, suspended_drivers: suspended, pending_drivers: pending };
}

// CSV export used by the drivers page and the home report button. Mirrors the
// V2 contract: same filters as listDrivers, masked phones, capped at 5000.
async function exportDrivers(query) {
  const deletionIds = await pendingDeletionDriverIds();
  const where = {
    ...(bucketWhereFor(query.status) || { role: 'driver' }),
    ...notPendingDeletion(deletionIds),
  };
  if (query.search) {
    const term = `%${query.search}%`;
    where[Op.or] = [{ fullName: { [Op.iLike]: term } }, { phone: { [Op.iLike]: term } }];
  }
  if (query.registration_from || query.registration_to) {
    where.createdat = {};
    if (query.registration_from) where.createdat[Op.gte] = new Date(`${query.registration_from}T00:00:00.000Z`);
    if (query.registration_to) where.createdat[Op.lte] = new Date(`${query.registration_to}T23:59:59.999Z`);
  }
  const rows = await User.findAll({
    where,
    attributes: ['id', 'fullName', 'phone', 'status', 'verificationStatus', 'createdat'],
    order: [['createdat', 'DESC']],
    limit: 5000,
  });
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = ['id,full_name,phone,account_status,created_at'];
  for (const u of rows) {
    lines.push([
      u.id,
      esc(u.fullName),
      esc(maskPhone(u.phone)),
      deriveAccountStatus(u),
      u.createdat ? u.createdat.toISOString() : '',
    ].join(','));
  }
  return lines.join('\n');
}

async function sendDriverNotification(adminId, driverId, dto) {
  const driver = await getDriverOrThrow(driverId);
  const results = await notificationService.sendToUser(driver, 'ADMIN_NOTICE', {
    channels: ['in_app', 'push'],
    vars: { title: dto.title, body: dto.body },
    data: { category: dto.type || 'general', sent_by: adminId },
  });
  const inApp = results?.in_app;
  const notificationId = inApp && inApp.id ? inApp.id : null;
  return {
    notification: {
      id: notificationId,
      user_id: driverId,
      title: dto.title,
      category: dto.type || 'general',
      created_at: inApp?.createdat || inApp?.createdAt || new Date().toISOString(),
    },
    delivery: {
      in_app: Boolean(notificationId),
      push: results?.push === true,
    },
  };
}

// Admin override used by the journeys page. Cancels the trip, releases seats,
// cancels non-terminal bookings and tells both sides. Mirrors the V2 behavior
// without the 1-hour passenger window.
async function cancelTrip(adminId, tripId, reason) {
  const trip = await Trip.findByPk(tripId);
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');
  if ([TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED].includes(trip.status)) {
    throw ApiErrors.conflict('TRIP_ALREADY_COMPLETED_OR_CANCELLED');
  }

  const result = await sequelize.transaction(async (t) => {
    const [claimed] = await Trip.update(
      { status: TRIP_STATUS.CANCELLED, isModerated: true, moderationReason: reason || 'Cancelled by administrator', moderatedBy: adminId },
      { where: { id: tripId, status: { [Op.notIn]: [TRIP_STATUS.COMPLETED, TRIP_STATUS.CANCELLED] } }, transaction: t }
    );
    if (!claimed) throw ApiErrors.conflict('TRIP_ALREADY_COMPLETED_OR_CANCELLED');

    const bookings = await Booking.findAll({
      where: { tripId, status: { [Op.in]: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] } },
      transaction: t,
    });
    if (bookings.length > 0) {
      await Booking.update(
        {
          status: BOOKING_STATUS.CANCELLED,
          cancellationReason: reason || 'Cancelled by administrator',
          cancelledBy: adminId,
          cancelledAt: new Date(),
        },
        { where: { id: { [Op.in]: bookings.map((b) => b.id) } }, transaction: t }
      );
      const seatNumbers = bookings.flatMap((b) => (b.seatNumbers && b.seatNumbers.length ? b.seatNumbers : b.seatNumber != null ? [b.seatNumber] : []));
      if (seatNumbers.length > 0) {
        await TripSeat.update({ seatType: 'available' }, { where: { tripId, seatNumber: { [Op.in]: seatNumbers } }, transaction: t });
      }
      const passengerIds = [...new Set(bookings.map((b) => b.passengerId))];
      for (const passengerId of passengerIds) {
        try {
          await Notification.create({
            userId: passengerId,
            type: 'TRIP_CANCELLED',
            title: 'Trip cancelled',
            body: `The trip ${trip.originCity} → ${trip.destinationCity} was cancelled by support.${reason ? ` Reason: ${reason}` : ''}`,
            data: { trip_id: tripId, reason: reason || null },
            sentVia: ['in_app'],
          }, { transaction: t });
        } catch (err) {
          console.warn('[adminDashboardService] trip cancellation notification failed:', err.message);
        }
      }
    }
    return { bookings: bookings.length };
  });

  try {
    await notificationService.sendToUser(await User.findByPk(trip.driverId), 'TRIP_CANCELLED', {
      channels: ['in_app', 'push'],
      vars: { route: `${trip.originCity} → ${trip.destinationCity}`, reason: reason || '' },
      data: { trip_id: tripId, reason: reason || null },
    });
  } catch (err) {
    console.warn('[adminDashboardService] driver trip cancellation notification failed:', err.message);
  }

  return {
    trip: { id: tripId, status: TRIP_STATUS.CANCELLED, cancellation_reason: reason || null },
    cancelled_bookings: result.bookings,
  };
}

async function getTripDetail(tripId) {
  const trip = await Trip.findByPk(tripId, {
    include: [
      { model: User, as: 'driver', attributes: ['id', 'fullName', 'phone', 'avgRating', 'avatarUrl'] },
      { model: TripStop, as: 'stops' },
      {
        model: Booking,
        as: 'bookings',
        include: [{ model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone', 'avatarUrl'] }],
      },
    ],
  });
  if (!trip) throw ApiErrors.notFound('TRIP_NOT_FOUND');

  const bookings = (trip.bookings || []).sort(
    (a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime(),
  );
  const activeBookings = bookings.filter((booking) => booking.status !== BOOKING_STATUS.CANCELLED);
  const totalBookingValue = activeBookings.reduce(
    (sum, booking) => sum + Number(booking.agreedFare || 0) * Number(booking.seatsBooked || 0),
    0,
  );

  return {
    trip: {
      id: trip.id,
      status: trip.status,
      abandoned_at: trip.abandonedAt,
      abandon_reason: trip.abandonReason,
      route: { origin: trip.originCity, destination: trip.destinationCity },
      origin_city: trip.originCity,
      origin_area: trip.originArea,
      origin_address: trip.originAddress,
      origin_lat: trip.originLat != null ? Number(trip.originLat) : null,
      origin_lng: trip.originLng != null ? Number(trip.originLng) : null,
      destination_city: trip.destinationCity,
      destination_area: trip.destinationArea,
      destination_address: trip.destinationAddress,
      destination_lat: trip.destinationLat != null ? Number(trip.destinationLat) : null,
      destination_lng: trip.destinationLng != null ? Number(trip.destinationLng) : null,
      route_polyline: trip.routePolyline ?? null,
      actual_path_polyline: trip.actualPathPolyline ?? null,
      route_status: trip.routeStatus ?? null,
      route_distance_m: trip.routeDistanceM != null ? Number(trip.routeDistanceM) : null,
      route_duration_s: trip.routeDurationS != null ? Number(trip.routeDurationS) : null,
      departure_time: trip.departureTime,
      arrival_time: trip.arrivalTime,
      total_seats: Number(trip.totalSeats),
      available_seats: Number(trip.availableSeats),
      seat_price: Number(trip.farePerSeat),
      trip_type: trip.isRecurring ? 'متكرر' : 'فردية',
      gender_preference: trip.genderPreference,
      reservations_count: activeBookings.length,
      passengers_count: activeBookings.reduce((sum, booking) => sum + Number(booking.seatsBooked || 0), 0),
      total_booking_value: totalBookingValue,
      stops: (trip.stops || []).map((stop) => ({
        id: stop.id,
        stop_order: stop.stopOrder,
        stop_name: stop.stopName,
        city: stop.city,
        address: stop.address,
        stop_type: stop.stopType,
        lat: stop.lat != null ? Number(stop.lat) : stop.stopLat != null ? Number(stop.stopLat) : null,
        lng: stop.lng != null ? Number(stop.lng) : stop.stopLng != null ? Number(stop.stopLng) : null,
      })),
    },
    driver: trip.driver
      ? {
        id: trip.driver.id,
        name: trip.driver.fullName,
        phone: maskPhone(trip.driver.phone),
        avatar_url: toAbsoluteMediaUrl(trip.driver.avatarUrl),
        avg_rating: Number(trip.driver.avgRating || 0),
      }
      : null,
    bookings: bookings.map((booking) => ({
      id: booking.id,
      booking_no: booking.referenceCode,
      status: booking.status,
      seats_booked: Number(booking.seatsBooked),
      seat_numbers: booking.seatNumbers,
      seat_price: Number(booking.agreedFare),
      total_price: Number(booking.agreedFare) * Number(booking.seatsBooked),
      payment_status: booking.paymentStatus,
      created_at: booking.createdat,
      pickup: {
        place: booking.pickupPlace,
        label: booking.pickupLabel,
        city: booking.pickupCity,
        area: booking.pickupArea,
        lat: booking.pickupLat != null ? Number(booking.pickupLat) : null,
        lng: booking.pickupLng != null ? Number(booking.pickupLng) : null,
        order: booking.pickupOrder != null ? Number(booking.pickupOrder) : null,
        status: booking.pickupStatus,
      },
      dropoff: {
        place: booking.dropoffPlace,
        lat: booking.dropoffLat != null ? Number(booking.dropoffLat) : null,
        lng: booking.dropoffLng != null ? Number(booking.dropoffLng) : null,
        deadline: booking.dropoffDeadline,
        dropped_off_at: booking.droppedOffAt,
      },
      passenger: booking.passenger
        ? {
          id: booking.passenger.id,
          name: booking.passenger.fullName,
          phone: maskPhone(booking.passenger.phone),
          avatar_url: toAbsoluteMediaUrl(booking.passenger.avatarUrl),
        }
        : null,
    })),
  };
}

// ===== US3: Dossier tabs =====

async function getDriverHeader(driverId) {
  const driver = await getDriverOrThrow(driverId);
  const [totalTrips, completedTrips, canceledTrips, reviewsCount, ratingAgg, profile, vehicle] = await Promise.all([
    Trip.count({ where: { driverId } }),
    Trip.count({ where: { driverId, status: TRIP_STATUS.COMPLETED } }),
    Trip.count({ where: { driverId, status: TRIP_STATUS.CANCELLED } }),
    Rating.count({ where: { rateeId: driverId } }),
    Rating.findOne({ attributes: [[fn('AVG', col('stars')), 'avg']], where: { rateeId: driverId } }),
    DriverProfile.findOne({ where: { driverId }, attributes: ['driverId'] }),
    Vehicle.findOne({ where: { driverId }, attributes: ['driverId'] }),
  ]);
  const computedAvg = ratingAgg?.get('avg') ? parseFloat(ratingAgg.get('avg')) : null;
  const missing = [];
  if (!driver.fullName || !String(driver.fullName).trim()) missing.push('name');
  if (!profile) missing.push('profile');
  if (!vehicle) missing.push('vehicle');
  return {
    id: driver.id,
    name: driver.fullName,
    phone: maskPhone(driver.phone),
    phone_full: driver.phone,
    age: driver.age != null ? Number(driver.age) : null,
    city: null,
    avatar_url: toAbsoluteMediaUrl(driver.avatarUrl),
    account_status: deriveAccountStatus(driver),
    signup_completed: missing.length === 0,
    signup_missing: missing,
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
      phone_full: driver.phone,
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
      from: t.originCity,
      to: t.destinationCity,
      date_time: t.departureTime,
      datetime: t.departureTime,
      seats: Number(t.totalSeats),
      bookings: aggs.get(t.id)?.reservations_count ?? 0,
      passengers_count: aggs.get(t.id)?.passengers_count ?? 0,
      reservations_count: aggs.get(t.id)?.reservations_count ?? 0,
      seat_price: Number(t.farePerSeat),
      price: Number(t.farePerSeat),
      status: t.status,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function getDriverEvaluations(driverId, query) {
  await getDriverOrThrow(driverId);
  const { page, limit, offset } = parsePagination(query);
  const direction = query.direction === 'given' ? 'given' : 'received';
  const where = direction === 'given' ? { raterId: driverId } : { rateeId: driverId };
  const [summaryRow, distRows, tagRows, { rows, count }] = await Promise.all([
    Rating.findOne({ attributes: [[fn('AVG', col('stars')), 'avg'], [fn('COUNT', col('id')), 'total']], where }),
    Rating.findAll({ attributes: ['stars', [fn('COUNT', col('id')), 'cnt']], where, group: ['stars'] }),
    Rating.findAll({ attributes: ['tags'], where: { ...where, tags: { [Op.ne]: null } } }),
    Rating.findAndCountAll({
      where,
      include: [
        { model: User, as: 'rater', attributes: ['id', 'fullName', 'avatarUrl'] },
        { model: User, as: 'ratee', attributes: ['id', 'fullName', 'avatarUrl'] },
      ],
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
  const reviews = rows.map((r) => {
    const counterpart = direction === 'received' ? r.rater : r.ratee;
    return {
      id: r.id,
      direction,
      passenger_name: counterpart?.fullName || 'Unknown',
      passenger_avatar: toAbsoluteMediaUrl(counterpart?.avatarUrl),
      rating: r.stars,
      stars: r.stars,
      comment: r.review,
      text: r.review,
      tags: r.tags || [],
      was_late: r.wasLate,
      date: r.createdat,
      created_at: r.createdat,
    };
  });
  return {
    direction,
    summary: {
      average_rating: summaryRow?.get('avg') ? parseFloat(summaryRow.get('avg')) : 0,
      total_reviews: Number(summaryRow?.get('total') || 0),
    },
    distribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: countsByStar.get(rating) || 0 })),
    top_tags: topTags,
    data: reviews,
    reviews,
    pagination: buildPagination(count, page, limit),
  };
}

async function getAccountLog(driverId) {
  await getDriverOrThrow(driverId);
  const now = new Date();
  const [penalties, complaints, profile, vehicle, reviews] = await Promise.all([
    Penalty.findAll({ where: { userId: driverId }, order: [['starts_at', 'DESC']] }),
    Complaint.findAll({
      where: { [Op.or]: [{ reporterId: driverId }, { accusedId: driverId }] },
      order: [['createdat', 'DESC']],
    }),
    DriverProfile.findOne({ where: { driverId } }),
    Vehicle.findOne({ where: { driverId } }),
    DocumentReview.findAll({ where: { driverId } }),
  ]);
  const uploadedDocuments = REQUIRED_DOCUMENTS.filter((def) => {
    const imageId = def.source === 'profile' ? profile?.[def.column] : vehicle?.[def.column];
    return imageId != null;
  });
  const decidedKeys = new Set(reviews.map((review) => review.documentKey));
  const pendingDocuments = uploadedDocuments.filter((def) => !decidedKeys.has(def.key)).length;
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
      pending_documents: pendingDocuments,
    },
    log,
    entries: log,
    rows: log,
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
      type: vehicle.vehicleType,
      make: vehicle.manufacturer,
      model: vehicle.model,
      year: vehicle.modelYear,
      color: vehicle.color,
      plate_number: vehicle.plateNumber,
      seats: vehicle.seats,
    },
    car_photos: { front: toAbsoluteMediaUrl(front ? front.url : null), rear: toAbsoluteMediaUrl(rear ? rear.url : null) },
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

  // The dashboard only approves individual documents. Once every uploaded
  // driver/vehicle document is approved the driver must actually become
  // verified (and receive the message); a rejected document must mark the
  // driver rejected and tell them why. Without this the admin's decision was
  // recorded on document_reviews only and the driver stayed pending forever.
  const verification = await syncVerificationFromDocuments(driverId, adminId, documentKey, decision, reason);

  return {
    document: {
      key: documentKey,
      status: decision,
      decided_by: adminId,
      decided_at: review.decidedAt,
      ...(reason ? { reason } : {}),
    },
    ...(verification ? { verification } : {}),
  };
}

const REQUIRED_DOCUMENTS = ALL_DOCUMENT_KEYS.filter((d) => d.source != null);

function documentImageId(def, profile, vehicle) {
  return def.source === 'profile' ? profile?.[def.column] : vehicle?.[def.column];
}

/**
 * Re-derive the driver-level verification state from the per-document review
 * rows. Called after every document decision so the existing dossier buttons
 * (اعتماد / رفض) produce the same outcome as the dedicated verification
 * approve/reject endpoints.
 */
async function syncVerificationFromDocuments(driverId, adminId, documentKey, decision, reason) {
  const [driver, profile, vehicle, reviews] = await Promise.all([
    User.findByPk(driverId),
    DriverProfile.findOne({ where: { driverId } }),
    Vehicle.findOne({ where: { driverId } }),
    DocumentReview.findAll({ where: { driverId } }),
  ]);
  if (!driver) return null;

  const reviewByKey = new Map(reviews.map((r) => [r.documentKey, r]));
  const rejectedKeys = REQUIRED_DOCUMENTS
    .filter((d) => reviewByKey.get(d.key)?.decision === 'rejected')
    .map((d) => d.key);
  const hasRejected = rejectedKeys.length > 0 || decision === 'rejected';
  const allUploaded = REQUIRED_DOCUMENTS.every((d) => documentImageId(d, profile, vehicle) != null);
  const allApproved = allUploaded && REQUIRED_DOCUMENTS.every((d) => reviewByKey.get(d.key)?.decision === 'approved');

  if (hasRejected) {
    const rejectionReason = reason
      || reviewByKey.get(documentKey)?.reason
      || 'One or more documents were rejected';
    const fields = rejectedKeys.length > 0 ? rejectedKeys : [documentKey];
    const alreadyRejected = driver.verificationStatus === VERIFICATION_STATUS.REJECTED
      && driver.isVerified === false
      && driver.verificationRejectionReason === rejectionReason;

    if (profile) await profile.update({ idVerified: false });
    if (vehicle) {
      await vehicle.update({
        isVerified: false,
        verificationNotes: rejectionReason,
        verificationRejectionReason: rejectionReason,
        verificationRejectedAt: new Date(),
      });
    }
    if (!alreadyRejected) {
      const fromStatus = driver.verificationStatus;
      await driver.update({
        isVerified: false,
        verificationStatus: VERIFICATION_STATUS.REJECTED,
        verificationRejectedAt: new Date(),
        verificationRejectionReason: rejectionReason,
        verificationRejectionFields: fields,
      });
      await VerificationStatusChange.create({
        driverId,
        fromStatus,
        toStatus: VERIFICATION_STATUS.REJECTED,
        reason: rejectionReason,
        markedFields: fields,
        changedBy: adminId,
      });
      try {
        await notificationService.sendToUser(driver, 'VERIFICATION_REJECTED', {
          channels: ['in_app', 'push'],
          vars: { subject: 'identity documents', reason: rejectionReason },
          data: { driver_id: driverId, reason: rejectionReason, fields_to_fix: fields },
        });
      } catch (err) {
        console.warn('[adminDashboardService] verification rejection notification failed:', err.message);
      }
    }
    return {
      status: VERIFICATION_STATUS.REJECTED,
      reason: rejectionReason,
      fields_to_fix: fields,
      notified: !alreadyRejected,
    };
  }

  if (!allApproved) {
    return { status: driver.verificationStatus, complete: false };
  }

  const alreadyApproved = driver.verificationStatus === VERIFICATION_STATUS.APPROVED
    && driver.isVerified === true
    && Boolean(profile?.idVerified)
    && Boolean(vehicle?.isVerified);
  if (alreadyApproved) {
    return { status: VERIFICATION_STATUS.APPROVED, complete: true, notified: false };
  }

  const fromStatus = driver.verificationStatus;
  if (profile) await profile.update({ idVerified: true });
  if (vehicle) {
    await vehicle.update({
      isVerified: true,
      verifiedBy: adminId,
      verifiedAt: new Date(),
      verificationRejectionReason: null,
      verificationNotes: null,
    });
  }
  await driver.update({
    isVerified: true,
    verificationStatus: VERIFICATION_STATUS.APPROVED,
    verificationRejectedAt: null,
    verificationRejectionReason: null,
    verificationRejectionFields: [],
  });
  await VerificationStatusChange.create({
    driverId,
    fromStatus,
    toStatus: VERIFICATION_STATUS.APPROVED,
    changedBy: adminId,
  });
  try {
    await notificationService.sendToUser(driver, 'VERIFICATION_APPROVED', {
      channels: ['in_app', 'push'],
      vars: { subject: 'identity documents' },
      data: { driver_id: driverId },
    });
  } catch (err) {
    console.warn('[adminDashboardService] verification approval notification failed:', err.message);
  }
  return { status: VERIFICATION_STATUS.APPROVED, complete: true, notified: true };
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
  exportDrivers,
  sendDriverNotification,
  cancelTrip,
  getTripDetail,
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
  syncVerificationFromDocuments,
  listReservations,
};
export { DOCUMENT_KEYS, ALL_DOCUMENT_KEYS, deriveAccountStatus, getSummary, getRecentTrips, getTopRoutes, getPendingRequests, getLatestComplaints, listDrivers, getDriverStats, exportDrivers, sendDriverNotification, cancelTrip, getTripDetail, getDriverHeader, getDriverOverview, listDriverTrips, getDriverEvaluations, getAccountLog, getCarDetails, getDocuments, setDriverStatus, applyStandingAction, decideDocument, syncVerificationFromDocuments, listReservations };
export default module.exports;