require('../setup/setup'); // sync schema + mock redis (side effects)
const { Trip, TripSeat, TripLocation, Booking, SosEvent, User, Vehicle, DriverProfile, SubscriptionPlan, DriverSubscription } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');
const { runRouteRetry } = require('../../jobs/routeRetryJob');
const { runActualPath } = require('../../jobs/actualPathJob');
const { runDataRetention } = require('../../jobs/dataRetentionJob');
const sosService = require('../../Services/sosService');

const DRIVER_ID = 'b1300000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'b1300000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'b1300000-0000-4000-8000-000000000010';

beforeEach(async () => {
  await SosEvent.destroy({ where: {}, force: true });
  await TripLocation.destroy({ where: {}, force: true });
  await Booking.destroy({ where: {}, force: true });
  await TripSeat.destroy({ where: {}, force: true });
  await Trip.destroy({ where: {}, force: true });
  await DriverProfile.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await DriverSubscription.destroy({ where: { driverId: DRIVER_ID }, force: true });
  await Vehicle.destroy({ where: { id: VEHICLE_ID }, force: true });
  await User.destroy({ where: { id: [DRIVER_ID, PASSENGER_ID] }, force: true });

  await User.create({ id: DRIVER_ID, fullName: 'Jobs Driver', phone: '+962799171111', countryCode: 'JO', role: 'driver', passwordHash: 'hashed', isVerified: true });
  await User.create({ id: PASSENGER_ID, fullName: 'Jobs Passenger', phone: '+962799172222', countryCode: 'JO', role: 'passenger', passwordHash: 'hashed', isVerified: true });
  await Vehicle.create({
    id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Toyota', model: 'Camry',
    vehicleType: 'sedan', modelYear: 2023, plateNumber: 'JOB-1301', color: 'White', seats: 4, isVerified: true,
  });
});

describe('US3 Integration - jobs and retention', () => {
  it('routeRetryJob recovers failed routes without throwing', async () => {
    const trip = await Trip.create({
      driverId: DRIVER_ID, vehicleId: VEHICLE_ID,
      originCity: 'Amman', originLat: 31.9539, originLng: 35.9106,
      destinationCity: 'Irbid', destinationLat: 32.5568, destinationLng: 35.8469,
      departureTime: new Date(Date.now() + 86400000), totalSeats: 4, availableSeats: 3,
      farePerSeat: 15.5, status: 'published', routeStatus: 'failed',
    });
    const out = await runRouteRetry();
    expect(out.retried).toBeGreaterThanOrEqual(1);
    expect(out.recovered).toBeGreaterThanOrEqual(1);
    const fresh = await Trip.findByPk(trip.id);
    expect(fresh.routeStatus).toBe('ready');
  });

  it('actualPathJob compacts completed trips missing a path', async () => {
    const trip = await Trip.create({
      driverId: DRIVER_ID, vehicleId: VEHICLE_ID,
      originCity: 'Amman', originLat: 31.9539, originLng: 35.9106,
      destinationCity: 'Irbid', destinationLat: 32.5568, destinationLng: 35.8469,
      departureTime: new Date(Date.now() - 86400000), totalSeats: 4, availableSeats: 3,
      farePerSeat: 15.5, status: 'completed',
    });
    await TripLocation.bulkCreate([
      { tripId: trip.id, driverId: DRIVER_ID, lat: 31.96, lng: 35.91 },
      { tripId: trip.id, driverId: DRIVER_ID, lat: 32.2, lng: 35.88 },
      { tripId: trip.id, driverId: DRIVER_ID, lat: 32.55, lng: 35.847 },
    ]);
    const out = await runActualPath();
    expect(out.compacted).toBeGreaterThanOrEqual(1);
    const fresh = await Trip.findByPk(trip.id);
    expect(typeof fresh.actualPathPolyline).toBe('string');
  });

  it('retention drops 30-day points but keeps year-old SOS-linked ones', async () => {
    const mkTrip = (status) => Trip.create({
      driverId: DRIVER_ID, vehicleId: VEHICLE_ID,
      originCity: 'Amman', originLat: 31.9539, originLng: 35.9106,
      destinationCity: 'Irbid', destinationLat: 32.5568, destinationLng: 35.8469,
      departureTime: new Date(Date.now() - 40 * 86400000), totalSeats: 4, availableSeats: 3,
      farePerSeat: 15.5, status,
    });
    const plain = await mkTrip('completed');
    const sosTrip = await mkTrip('completed');
    const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    await TripLocation.create({ tripId: plain.id, driverId: DRIVER_ID, lat: 31.96, lng: 35.91, createdat: old });
    await TripLocation.create({ tripId: sosTrip.id, driverId: DRIVER_ID, lat: 31.96, lng: 35.91, createdat: old });
    await SosEvent.create({ userId: PASSENGER_ID, tripId: sosTrip.id, lat: 32.25, lng: 35.8793, urgency: 'high', status: 'pending' });

    await runDataRetention();
    expect(await TripLocation.count({ where: { tripId: plain.id } })).toBe(0);
    expect(await TripLocation.count({ where: { tripId: sosTrip.id } })).toBe(1);
  });

  it('SOS trigger on a live trip stores the passenger position', async () => {
    const trip = await Trip.create({
      driverId: DRIVER_ID, vehicleId: VEHICLE_ID,
      originCity: 'Amman', originLat: 31.9539, originLng: 35.9106,
      destinationCity: 'Irbid', destinationLat: 32.5568, destinationLng: 35.8469,
      departureTime: new Date(Date.now() + 86400000), totalSeats: 4, availableSeats: 2,
      farePerSeat: 15.5, status: 'in_progress',
    });
    await Booking.create({
      tripId: trip.id, passengerId: PASSENGER_ID, seatsBooked: 1, agreedFare: 15.5,
      status: 'confirmed', referenceCode: 'MSR-SOS001',
    });
    await TripLocation.create({ tripId: trip.id, driverId: DRIVER_ID, lat: 32.0, lng: 35.895 });

    const out = await sosService.trigger({ id: PASSENGER_ID, role: 'passenger' }, { tripId: trip.id, lat: 32.25, lng: 35.8793 });
    expect(out.sos_event_id).toBeDefined();
    const event = await SosEvent.findByPk(out.sos_event_id);
    expect(Number(event.lat)).toBeCloseTo(32.25, 4);
  });
});
