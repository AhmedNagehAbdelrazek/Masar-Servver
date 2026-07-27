const { Op } = require('sequelize');
const { Trip, TripSeat, TripStop, Vehicle, User, Booking, Rating } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');
const { TRIP_STATUS, GENDER_PREFERENCE } = require('../config/constants');

/**
 * Create a new trip with seats, waypoints, and recurrence
 */
const createTrip = async (driverId, data) => {
  // Verify driver exists and is verified
  const driver = await User.findByPk(driverId);
  if (!driver) throw ApiErrors.notFound('User not found');
  if (driver.role !== 'driver') throw ApiErrors.forbidden('Only drivers can create trips');
  if (!driver.isVerified) throw ApiErrors.forbidden('Driver not verified');

  // Verify vehicle belongs to driver
  const vehicle = await Vehicle.findOne({
    where: { id: data.vehicle_id, driverId },
  });
  if (!vehicle) throw ApiErrors.forbidden('Vehicle not found or does not belong to driver');

  // Validate seat configuration matches vehicle
  if (data.seats.length !== vehicle.seats) {
    throw ApiErrors.validation('Seat count does not match vehicle total seats');
  }

  // Validate seat numbers are sequential 1 to N
  const seatNumbers = data.seats.map((s) => s.seat_number).sort((a, b) => a - b);
  const expectedNumbers = Array.from({ length: vehicle.seats }, (_, i) => i + 1);
  if (JSON.stringify(seatNumbers) !== JSON.stringify(expectedNumbers)) {
    throw ApiErrors.validation('Seat numbers must be sequential from 1 to total seats');
  }

  // Validate at least one available seat
  const availableSeats = data.seats.filter((s) => s.type === 'available');
  if (availableSeats.length === 0) {
    throw ApiErrors.validation('At least one seat must be available');
  }

  // Validate exactly one driver seat
  const driverSeats = data.seats.filter((s) => s.type === 'driver');
  if (driverSeats.length !== 1) {
    throw ApiErrors.validation('Exactly one seat must be marked as driver');
  }

  // Validate departure time is in the future
  const departureDateTime = new Date(`${data.departure_date}T${data.departure_time}`);
  if (departureDateTime <= new Date()) {
    throw ApiErrors.validation('Departure time must be in the future');
  }

  // Validate recurrence
  const isRecurring = data.type_of_trip === 'repeated';
  if (isRecurring && (!data.repeated_days || data.repeated_days.length === 0)) {
    throw ApiErrors.validation('Repeated days are required for recurring trips');
  }
  if (isRecurring && !data.repeated_end_date) {
    throw ApiErrors.validation('End date is required for recurring trips');
  }
  if (isRecurring) {
    const endDate = new Date(data.repeated_end_date);
    if (endDate <= departureDateTime) {
      throw ApiErrors.validation('End date must be after departure date');
    }
  }

  // Create trip
  const trip = await Trip.create({
    driverId,
    vehicleId: data.vehicle_id,
    originCity: data.origin_city,
    originArea: data.origin_area || null,
    originLat: data.origin_lat || null,
    originLng: data.origin_lng || null,
    destinationCity: data.destination_city,
    destinationArea: data.destination_area || null,
    destinationLat: data.destination_lat || null,
    destinationLng: data.destination_lng || null,
    departureTime: departureDateTime,
    totalSeats: vehicle.seats,
    availableSeats: availableSeats.length,
    farePerSeat: data.fare_per_seat,
    isRecurring,
    recurrenceDays: isRecurring ? data.repeated_days : null,
    recurrenceEndDate: isRecurring ? data.repeated_end_date : null,
    genderPreference: data.allowed_type || GENDER_PREFERENCE.ALL,
    driverInstructions: data.instructions || null,
    additionalInstructions: data.additional_instructions || null,
    status: TRIP_STATUS.PUBLISHED,
  });

  // Create seat configurations
  const seatRecords = data.seats.map((s) => ({
    tripId: trip.id,
    seatNumber: s.seat_number,
    seatType: s.type,
  }));
  await TripSeat.bulkCreate(seatRecords);

  // Create waypoints
  if (data.waypoints && data.waypoints.length > 0) {
    const stopRecords = data.waypoints.map((w, index) => ({
      tripId: trip.id,
      stopOrder: index + 1,
      stopName: w.stop_name || null,
      stopLat: w.stop_lat || null,
      stopLng: w.stop_lng || null,
    }));
    await TripStop.bulkCreate(stopRecords);
  }

  return {
    trip_id: trip.id,
    status: trip.status,
    total_seats: trip.totalSeats,
    available_seats: trip.availableSeats,
    estimated_earnings: trip.availableSeats * trip.farePerSeat,
    message: 'Trip published successfully!',
  };
};

/**
 * Get trip by ID with seats and stops
 */
const getTripById = async (tripId) => {
  const trip = await Trip.findByPk(tripId, {
    include: [
      { model: TripSeat, as: 'seats' },
      { model: TripStop, as: 'stops' },
      { model: Vehicle, as: 'vehicle' },
    ],
  });
  if (!trip) throw ApiErrors.notFound('Trip not found');
  return trip;
};

/**
 * Get trips for a driver
 */
const getDriverTrips = async (driverId, status = null) => {
  const where = { driverId };
  if (status) where.status = status;

  const trips = await Trip.findAll({
    where,
    include: [
      { model: TripSeat, as: 'seats' },
      { model: TripStop, as: 'stops' },
    ],
    order: [['departure_time', 'ASC']],
  });
  return trips;
};

/**
 * Get available trips for passengers (with recurrence expansion)
 */
const getAvailableTrips = async (originCity, destinationCity, date, genderPreference = null) => {
  const queryDate = new Date(date);

  const where = {
    status: TRIP_STATUS.PUBLISHED,
    availableSeats: { [Op.gt]: 0 },
    [Op.or]: [
      // One-time trips for this date
      {
        isRecurring: false,
        departureTime: {
          [Op.and]: [
            { [Op.gte]: new Date(queryDate.setHours(0, 0, 0, 0)) },
            { [Op.lt]: new Date(queryDate.setHours(23, 59, 59, 999)) },
          ],
        },
      },
      // Recurring trips matching this day of week
      {
        isRecurring: true,
        recurrenceDays: { [Op.contains]: [queryDate.getDay()] },
        recurrenceEndDate: { [Op.or]: [{ [Op.gte]: queryDate }, { [Op.is]: null }] },
      },
    ],
  };

  if (originCity) where.originCity = originCity;
  if (destinationCity) where.destinationCity = destinationCity;
  if (genderPreference && genderPreference !== GENDER_PREFERENCE.ALL) {
    where.genderPreference = { [Op.in]: [GENDER_PREFERENCE.ALL, genderPreference] };
  }

  const trips = await Trip.findAll({
    where,
    include: [
      { model: TripSeat, as: 'seats', where: { seatType: 'available' } },
      { model: TripStop, as: 'stops' },
      { model: Vehicle, as: 'vehicle' },
    ],
    order: [['departure_time', 'ASC']],
  });

  return trips;
};

module.exports = {
  createTrip,
  getTripById,
  getDriverTrips,
  getAvailableTrips,
};
