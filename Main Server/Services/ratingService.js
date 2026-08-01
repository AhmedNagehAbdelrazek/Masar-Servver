const sequelize = require('../config/database');
const { Rating, Booking, Trip, User } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { parsePagination, buildPagination } = require('../utils/pagination');

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

  const rateeId =
    booking.passengerId === raterId
      ? booking.trip.driverId
      : booking.passengerId;

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

module.exports = { create, listReceived, updateDriverAvg };
