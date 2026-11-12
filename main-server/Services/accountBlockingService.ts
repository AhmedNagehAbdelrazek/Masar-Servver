// @ts-nocheck
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Booking, RideRequest, Trip, TripSeat, User } from '../Models';
import { BOOKING_STATUS, TRIP_STATUS } from '../config/constants';
import notificationService from './notificationService';

const BLOCKED_TRIP_STATUSES = [
  TRIP_STATUS.PUBLISHED,
  TRIP_STATUS.FULL,
  TRIP_STATUS.IN_PROGRESS,
  TRIP_STATUS.ONGOING,
];
const BLOCKED_BOOKING_STATUSES = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED];

/**
 * Suspension/ban must remove the account's current and future inventory, not
 * just revoke its sessions. Driver trips are cancelled and their passengers
 * are notified; passenger bookings are cancelled, seats released, and drivers
 * are notified. In-flight trips/bookings are included because a stopped
 * account must not keep serving them.
 */
async function blockDriverTrips(actorId, driverId, reason) {
  const trips = await Trip.findAll({
    where: { driverId, status: { [Op.in]: BLOCKED_TRIP_STATUSES } },
    include: [
      {
        model: Booking,
        as: 'bookings',
        where: { status: { [Op.in]: BLOCKED_BOOKING_STATUSES } },
        required: false,
        include: [
          {
            model: User,
            as: 'passenger',
            attributes: ['id', 'fullName', 'phone', 'fcmToken', 'locale'],
          },
        ],
      },
    ],
  });

  let tripsCancelled = 0;
  let bookingsCancelled = 0;

  for (const trip of trips) {
    const bookings = (trip.bookings || []).filter((booking) =>
      BLOCKED_BOOKING_STATUSES.includes(booking.status),
    );
    if (bookings.length > 0) {
      await sequelize.transaction(async (transaction) => {
        await Booking.update(
          {
            status: BOOKING_STATUS.CANCELLED,
            cancellationReason: reason,
            cancelledBy: actorId,
            cancelledAt: new Date(),
          },
          {
            where: {
              id: { [Op.in]: bookings.map((booking) => booking.id) },
              status: { [Op.in]: BLOCKED_BOOKING_STATUSES },
            },
            transaction,
          },
        );
        await Trip.update(
          {
            status: TRIP_STATUS.CANCELLED,
            isModerated: true,
            moderationReason: reason,
            moderatedBy: actorId,
          },
          {
            where: { id: trip.id, status: { [Op.in]: BLOCKED_TRIP_STATUSES } },
            transaction,
          },
        );
      });
    } else {
      await Trip.update(
        {
          status: TRIP_STATUS.CANCELLED,
          isModerated: true,
          moderationReason: reason,
          moderatedBy: actorId,
        },
        { where: { id: trip.id, status: { [Op.in]: BLOCKED_TRIP_STATUSES } } },
      );
    }

    tripsCancelled += 1;
    bookingsCancelled += bookings.length;

    for (const booking of bookings) {
      if (!booking.passenger) continue;
      try {
        await notificationService.sendToUser(booking.passenger, 'TRIP_CANCELLED', {
          channels: ['in_app', 'push'],
          vars: {
            route: `${trip.originCity} → ${trip.destinationCity}`,
            reason,
          },
          data: {
            trip_id: trip.id,
            booking_id: booking.id,
            reason,
            source: 'account_block',
          },
        });
      } catch {
        // Notifications are best-effort.
      }
    }
  }

  return { trips_cancelled: tripsCancelled, bookings_cancelled: bookingsCancelled };
}

async function blockPassengerBookings(actorId, passengerId, reason) {
  const bookings = await Booking.findAll({
    where: {
      passengerId,
      status: { [Op.in]: BLOCKED_BOOKING_STATUSES },
    },
    include: [
      {
        model: Trip,
        as: 'trip',
        required: true,
        where: { status: { [Op.in]: BLOCKED_TRIP_STATUSES } },
        include: [{ model: User, as: 'driver', attributes: ['id', 'fullName', 'fcmToken', 'locale'] }],
      },
      { model: User, as: 'passenger', attributes: ['id', 'fullName'] },
    ],
  });

  let bookingsCancelled = 0;

  for (const booking of bookings) {
    const trip = booking.trip;
    const bookedSeats = Array.isArray(booking.seatNumbers) && booking.seatNumbers.length
      ? booking.seatNumbers
      : booking.seatNumber != null
        ? [booking.seatNumber]
        : [];

    await sequelize.transaction(async (transaction) => {
      const [claimed] = await Booking.update(
        {
          status: BOOKING_STATUS.CANCELLED,
          cancellationReason: reason,
          cancelledBy: actorId,
          cancelledAt: new Date(),
        },
        {
          where: {
            id: booking.id,
            status: { [Op.in]: BLOCKED_BOOKING_STATUSES },
          },
          transaction,
        },
      );
      if (!claimed) return;

      const freshTrip = await Trip.findByPk(booking.tripId, { transaction });
      if (freshTrip) {
        const availableSeats = Math.min(
          Number(freshTrip.totalSeats),
          Number(freshTrip.availableSeats) + Number(booking.seatsBooked),
        );
        await freshTrip.update(
          {
            availableSeats,
            ...(freshTrip.status === TRIP_STATUS.FULL && availableSeats > 0
              ? { status: TRIP_STATUS.PUBLISHED }
              : {}),
          },
          { transaction },
        );
      }

      if (bookedSeats.length > 0) {
        await TripSeat.update(
          { seatType: 'available' },
          {
            where: { tripId: booking.tripId, seatNumber: { [Op.in]: bookedSeats } },
            transaction,
          },
        );
      }
    });

    bookingsCancelled += 1;

    if (trip?.driver) {
      try {
        await notificationService.sendToUser(trip.driver, 'BOOKING_CANCELLED_DRIVER', {
          channels: ['in_app', 'push'],
          vars: {
            passenger: booking.passenger?.fullName || 'راكب',
            seat_number: bookedSeats.join('، '),
            route: `${trip.originCity} → ${trip.destinationCity}`,
          },
          data: {
            booking_id: booking.id,
            trip_id: trip.id,
            reason,
            source: 'account_block',
          },
        });
      } catch {
        // Notifications are best-effort.
      }
    }
  }

  const requests = await RideRequest.update(
    { status: 'cancelled' },
    {
      where: {
        passengerId,
        status: { [Op.in]: ['open', 'offered', 'accepted'] },
      },
    },
  );

  return {
    bookings_cancelled: bookingsCancelled,
    requests_cancelled: Number(requests?.[0] ?? requests ?? 0),
  };
}

async function blockAccountInventory(actorId, user, reason) {
  if (!user) return null;
  if (user.role === 'driver') {
    return blockDriverTrips(actorId, user.id, reason);
  }
  if (user.role === 'passenger') {
    return blockPassengerBookings(actorId, user.id, reason);
  }
  return null;
}

module.exports = { blockAccountInventory, blockDriverTrips, blockPassengerBookings };
export { blockAccountInventory, blockDriverTrips, blockPassengerBookings };
export default module.exports;
