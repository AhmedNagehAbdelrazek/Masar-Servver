const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { Rating, Booking, Trip, User } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');
const auditService = require('./auditService');

function serializeRating(rating) {
  return {
    id: rating.id,
    booking_id: rating.bookingId,
    stars: rating.stars,
    was_late: rating.wasLate,
    late_minutes: rating.lateMinutes,
    review: rating.review,
    tags: rating.tags,
    created_at: rating.createdat || rating.createdAt,
  };
}

function serializeReceived(rating) {
  return {
    id: rating.id,
    stars: rating.stars,
    was_late: rating.wasLate,
    late_minutes: rating.lateMinutes,
    review: rating.review,
    tags: rating.tags,
    rater_name: rating.rater ? rating.rater.fullName : null,
    booking_id: rating.bookingId,
    created_at: rating.createdat || rating.createdAt,
  };
}

/**
 * Recompute a user's average rating over their visible ratings (1 decimal).
 */
async function updateDriverAvg(rateeId, transaction = null) {
  const ratings = await Rating.findAll({
    where: { rateeId, isVisible: true },
    attributes: ['stars'],
    transaction,
  });
  const avg =
    ratings.length === 0
      ? 0
      : Math.round(
          (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length) * 10
        ) / 10;
  await User.update({ avgRating: avg }, { where: { id: rateeId }, transaction });
  return avg;
}

/**
 * Submit a rating for a booking (contract D5). Idempotent: one rating per
 * (booking_id, rater_id); a repeat returns the existing rating untouched
 * (immutable after submit). Ratee is inferred from the booking — the
 * passenger rates the trip's driver and vice versa.
 */
async function create(raterId, data) {
  const booking = await Booking.findByPk(data.booking_id, {
    include: [{ model: Trip, as: 'trip', attributes: ['id', 'driverId'] }],
  });
  if (!booking) throw ApiErrors.notFound('Booking not found');

  const isPassenger = booking.passengerId === raterId;
  const isDriver = booking.trip.driverId === raterId;
  if (!isPassenger && !isDriver) {
    throw ApiErrors.forbidden('Only the passenger or the driver of a booking may rate it');
  }

  const rateeId = isPassenger ? booking.trip.driverId : booking.passengerId;

  const existing = await Rating.findOne({
    where: { bookingId: booking.id, raterId },
  });
  if (existing) {
    return { rating: serializeRating(existing), already_rated: true };
  }

  const rating = await sequelize.transaction(async (transaction) => {
    const created = await Rating.create(
      {
        bookingId: booking.id,
        raterId,
        rateeId,
        stars: data.stars,
        wasLate: data.was_late || false,
        lateMinutes: data.was_late ? data.late_minutes || 0 : 0,
        review: data.review || null,
        tags: data.tags || [],
      },
      { transaction }
    );
    await updateDriverAvg(rateeId, transaction);
    return created;
  });

  auditService.track({
    action: 'rating.submitted',
    resourceType: 'rating',
    resourceId: rating.id,
    actorId: raterId,
    actorType: isPassenger ? 'passenger' : 'driver',
    payload: {
      booking_id: booking.id,
      ratee_id: rateeId,
      stars: rating.stars,
      was_late: rating.wasLate,
    },
  });

  return { rating: serializeRating(rating), already_rated: false };
}

/**
 * Paginated list of ratings a driver has received (contract D6).
 */
async function listReceived(rateeId, filters = {}) {
  const { page, limit, offset } = parsePagination(filters);

  const { rows, count } = await Rating.findAndCountAll({
    where: { rateeId },
    include: [{ model: User, as: 'rater', attributes: ['id', 'fullName'] }],
    order: [['createdat', 'DESC']],
    offset,
    limit,
  });

  return {
    data: rows.map(serializeReceived),
    pagination: buildPagination(count, page, limit),
  };
}

/**
 * Ratings screen payload for the profile (spec 010, contracts §3): paginated
 * reviews plus star distribution and punctuality summary. Only visible
 * ratings count toward every figure.
 */
const SORT_ORDERS = {
  recent: [['createdat', 'DESC']],
  highest: [['stars', 'DESC'], ['createdat', 'DESC']],
  lowest: [['stars', 'ASC'], ['createdat', 'DESC']],
};

async function listWithDistribution(rateeId, filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(filters.limit, 10) || 10));
  const offset = (page - 1) * limit;
  const sort = SORT_ORDERS[filters.sort] ? filters.sort : 'recent';

  const visibleWhere = { rateeId, isVisible: { [Op.ne]: false } };

  const [{ rows, count }, distributionRows, onTimeCount, user] = await Promise.all([
    Rating.findAndCountAll({
      where: visibleWhere,
      include: [{ model: User, as: 'rater', attributes: ['id', 'fullName'] }],
      order: SORT_ORDERS[sort],
      offset,
      limit,
    }),
    Rating.findAll({
      where: visibleWhere,
      attributes: [
        'stars',
        [sequelize.fn('COUNT', sequelize.col('Rating.id')), 'count'],
      ],
      group: ['stars'],
      raw: true,
    }),
    Rating.count({ where: { ...visibleWhere, wasLate: false } }),
    User.findByPk(rateeId, { attributes: ['id', 'avgRating'] }),
  ]);

  const total = Number(count) || 0;
  const distMap = {};
  for (const row of distributionRows) {
    distMap[row.stars] = Number(row.count);
  }
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: distMap[stars] || 0,
    percentage: total ? Math.round(((distMap[stars] || 0) / total) * 100) : 0,
  }));

  return {
    summary: {
      average_rating: Number(user?.avgRating || 0),
      total_ratings: total,
      punctuality_rate: total ? Math.round((onTimeCount / total) * 100) : 0,
      distribution,
    },
    data: rows.map(serializeReceived),
    pagination: buildPagination(total, page, limit),
  };
}

module.exports = { create, listReceived, listWithDistribution };
