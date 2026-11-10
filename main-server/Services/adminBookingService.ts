// @ts-nocheck
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Booking, Trip, User, TripSeat, Notification, RideRequest } from '../Models';
import { parsePagination, buildPagination } from '../utils/pagination';
import { ApiErrors } from '../utils/ApiError';
import { maskPhone } from '../utils/masking';
import { daysAgo, percentChange } from '../utils/statChange';

const UPCOMING_TRIP = ['published', 'full'];
const ACTIVE_TRIP = ['in_progress', 'ongoing'];

function dateBound(from, to) {
  const where = {};
  if (from) where[Op.gte] = new Date(`${from}T00:00:00.000Z`);
  if (to) where[Op.lte] = new Date(`${to}T23:59:59.999Z`);
  return where;
}

async function getStats() {
  const [total, completed, cancelled, upcoming, inProgress] = await Promise.all([
    Booking.count(),
    Booking.count({ where: { status: 'completed' } }),
    Booking.count({ where: { status: 'cancelled' } }),
    Booking.count({
      where: { status: { [Op.in]: ['pending', 'confirmed'] } },
      include: [{ model: Trip, as: 'trip', attributes: [], where: { status: { [Op.in]: UPCOMING_TRIP } }, required: true }],
    }),
    Booking.count({
      where: { status: 'confirmed' },
      include: [{ model: Trip, as: 'trip', attributes: [], where: { status: { [Op.in]: ACTIVE_TRIP } }, required: true }],
    }),
  ]);
  const cutoff = daysAgo(7);
  const [totalBefore, completedBefore, cancelledBefore] = await Promise.all([
    Booking.count({ where: { createdat: { [Op.lte]: cutoff } } }),
    Booking.count({ where: { status: 'completed', completedAt: { [Op.lte]: cutoff } } }),
    Booking.count({ where: { status: 'cancelled', cancelledAt: { [Op.lte]: cutoff } } }),
  ]);
  return {
    total_bookings: total,
    upcoming,
    in_progress: inProgress,
    completed,
    cancelled,
    changes: {
      total_bookings: percentChange(total, totalBefore),
      completed: percentChange(completed, completedBefore),
      cancelled: percentChange(cancelled, cancelledBefore),
    },
  };
}

async function listBookings(query = {}) {
  const { page, limit, offset } = parsePagination(query);
  const where = {};
  switch (query.status) {
    case 'upcoming':
      where.status = { [Op.in]: ['pending', 'confirmed'] };
      break;
    case 'in_progress':
      where.status = 'confirmed';
      break;
    case 'completed':
      where.status = 'completed';
      break;
    case 'cancelled':
      where.status = 'cancelled';
      break;
    default:
      break;
  }
  if (query.search) {
    const term = `%${query.search}%`;
    where[Op.or] = [
      { referenceCode: { [Op.iLike]: term } },
      { '$passenger.full_name$': { [Op.iLike]: term } },
      { '$passenger.phone$': { [Op.iLike]: term } },
    ];
  }
  if (query.from || query.to) where.createdat = dateBound(query.from, query.to);

  const tripWhere = {};
  if (query.status === 'upcoming') tripWhere.status = { [Op.in]: UPCOMING_TRIP };
  if (query.status === 'in_progress') tripWhere.status = { [Op.in]: ACTIVE_TRIP };

  const include = [
    { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone'], required: false },
    {
      model: Trip,
      as: 'trip',
      attributes: ['id', 'originCity', 'destinationCity', 'departureTime', 'totalSeats', 'availableSeats', 'status'],
      where: Object.keys(tripWhere).length ? tripWhere : undefined,
      required: Object.keys(tripWhere).length > 0,
    },
  ];
  if (query.search) include[0].required = true;

  const { rows, count } = await Booking.findAndCountAll({
    where,
    include,
    order: [['createdat', 'DESC']],
    offset,
    limit,
    distinct: true,
    subQuery: false,
  });
  return {
    data: rows.map((b) => ({
      id: b.id,
      booking_no: b.referenceCode,
      passenger: b.passenger
        ? { id: b.passenger.id, name: b.passenger.fullName, phone: maskPhone(b.passenger.phone) }
        : null,
      route: b.trip ? `${b.trip.originCity} ← ${b.trip.destinationCity}` : null,
      booking_date: b.createdat,
      trip_no: b.trip?.id || b.tripId,
      trip_status: b.trip?.status || null,
      seats: b.trip ? `${b.seatsBooked} / ${Number(b.trip.totalSeats)}` : `${b.seatsBooked}`,
      seat_price: Number(b.agreedFare),
      status: b.status,
    })),
    pagination: buildPagination(count, page, limit),
  };
}

async function getDetail(bookingId) {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: User, as: 'passenger', attributes: ['id', 'fullName', 'phone', 'age', 'gender', 'createdat', 'lastLoginAt'] },
      {
        model: Trip,
        as: 'trip',
        include: [{ model: User, as: 'driver', attributes: ['id', 'fullName', 'phone', 'age', 'createdat', 'lastLoginAt'] }],
      },
    ],
  });
  if (!booking) throw ApiErrors.notFound('BOOKING_NOT_FOUND');
  const trip = booking.trip;
  const [totalBookings, completedBookings, cancelledBookings, requestTotal, lastBooking] = await Promise.all([
    Booking.count({ where: { passengerId: booking.passengerId } }),
    Booking.count({ where: { passengerId: booking.passengerId, status: 'completed' } }),
    Booking.count({ where: { passengerId: booking.passengerId, status: 'cancelled' } }),
    RideRequest.count({ where: { passengerId: booking.passengerId } }),
    Booking.findOne({
      where: { passengerId: booking.passengerId },
      include: [{ model: Trip, as: 'trip', attributes: ['id', 'originCity', 'destinationCity'] }],
      order: [['createdat', 'DESC']],
    }),
  ]);
  const timeline = [{ event: 'created', at: booking.createdat }];
  if (booking.status !== 'pending' && booking.status !== 'cancelled') {
    timeline.push({ event: 'confirmed', at: booking.updatedat });
  }
  if (trip) timeline.push({ event: 'linked_to_trip', trip_id: trip.id, at: booking.createdat });
  if (booking.status === 'cancelled') {
    timeline.push({ event: 'cancelled', at: booking.cancelledAt, reason: booking.cancellationReason, cancelled_by: booking.cancelledBy });
  }
  if (booking.status === 'completed') timeline.push({ event: 'completed', at: booking.completedAt });

  return {
    booking: {
      id: booking.id,
      booking_no: booking.referenceCode,
      trip_no: booking.tripId,
      status: booking.status,
      created_date: booking.createdat,
      seats_booked: booking.seatsBooked,
      seat_numbers: booking.seatNumbers,
      seat_price: Number(booking.agreedFare),
      total_price: Number(booking.agreedFare) * Number(booking.seatsBooked),
      currency: booking.currency,
      payment_status: booking.paymentStatus,
      cancellation_reason: booking.cancellationReason,
      cancelled_by: booking.cancelledBy,
      cancelled_at: booking.cancelledAt,
    },
    timeline,
    trip: trip
      ? {
        id: trip.id,
        origin_city: trip.originCity,
        destination_city: trip.destinationCity,
        departure_time: trip.departureTime,
        arrival_time: trip.arrivalTime,
        seats_booked: booking.seatsBooked,
        total_seats: Number(trip.totalSeats),
        available_seats: Number(trip.availableSeats),
        status: trip.status,
      }
      : null,
    driver: trip && trip.driver
      ? { ...trip.driver.toJSON(), phone: maskPhone(trip.driver.phone) }
      : null,
    passenger: booking.passenger
      ? { ...booking.passenger.toJSON(), phone: maskPhone(booking.passenger.phone) }
      : null,
    passenger_activity: {
      total_bookings: totalBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
      requests_total: requestTotal,
      last_booking: lastBooking
        ? {
          id: lastBooking.id,
          reference_code: lastBooking.referenceCode,
          status: lastBooking.status,
          trip: lastBooking.trip,
          created_at: lastBooking.createdat,
        }
        : null,
    },
  };
}

async function cancelBooking(adminId, bookingId, dto = {}) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw ApiErrors.notFound('BOOKING_NOT_FOUND');
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw ApiErrors.custom('BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED', 409, 'BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED');
  }
  const reason = dto.notes ? `${dto.reason}: ${dto.notes}` : dto.reason;

  const updated = await sequelize.transaction(async (t) => {
    const [claimed] = await Booking.update(
      {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: new Date(),
        cancelledBy: adminId,
      },
      { where: { id: bookingId, status: { [Op.in]: ['pending', 'confirmed'] } }, transaction: t }
    );
    if (!claimed) {
      throw ApiErrors.custom('BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED', 409, 'BOOKING_IS_ALREADY_COMPLETED_OR_CANCELLED');
    }
    const freshTrip = await Trip.findByPk(booking.tripId, { transaction: t });
    if (freshTrip) {
      const availableSeats = Number(freshTrip.availableSeats) + Number(booking.seatsBooked);
      await freshTrip.update({
        availableSeats,
        ...(freshTrip.status === 'full' && availableSeats > 0 && availableSeats <= Number(freshTrip.totalSeats)
          ? { status: 'published' }
          : {}),
      }, { transaction: t });
    }
    const bookedSeats = booking.seatNumbers && booking.seatNumbers.length
      ? booking.seatNumbers
      : booking.seatNumber != null ? [booking.seatNumber] : [];
    if (bookedSeats.length) {
      await TripSeat.update(
        { seatType: 'available' },
        { where: { tripId: booking.tripId, seatNumber: { [Op.in]: bookedSeats } }, transaction: t }
      );
    }
    try {
      await Notification.create({
        userId: booking.passengerId,
        type: 'BOOKING_CANCELLED',
        title: 'Booking cancelled',
        body: `Your booking ${booking.referenceCode} was cancelled by support. Reason: ${dto.reason}`,
        data: { booking_id: bookingId, reason: dto.reason },
        sentVia: ['in_app'],
      }, { transaction: t });
    } catch (err) {
      console.warn('[adminBookingService] cancel notification failed:', err.message);
    }
    return Booking.findByPk(bookingId, { transaction: t });
  });

  return {
    booking: {
      id: updated.id,
      reference_code: updated.referenceCode,
      status: updated.status,
      cancellation_reason: updated.cancellationReason,
      cancelled_by: updated.cancelledBy,
      cancelled_at: updated.cancelledAt,
    },
  };
}

module.exports = { getStats, listBookings, getDetail, cancelBooking };
export { getStats, listBookings, getDetail, cancelBooking };
export default module.exports;
