import { describe, it, expect, beforeEach } from '@jest/globals';
import { User, Vehicle, Trip, TripSeat, Booking, Rating, DriverProfile } from '../../Models';
import { TRIP_STATUS } from '../../config/constants';
import { recomputeForDriver, recomputeAllDrivers } from '../../Services/driverStatsService';

const DRIVER_ID = 'c4000000-0000-4000-8000-000000000001';
const PASSENGER_ID = 'c4000000-0000-4000-8000-000000000002';
const VEHICLE_ID = 'c4000000-0000-4000-8000-000000000010';

let hostTrip: { tripId: string; bookingId: string };

async function createHostTrip(status: string = TRIP_STATUS.PUBLISHED): Promise<{
  tripId: string;
  bookingId: string;
}> {
  const trip = (await Trip.create({
    driverId: DRIVER_ID,
    vehicleId: VEHICLE_ID,
    originCity: 'Amman',
    destinationCity: 'Irbid',
    departureTime: new Date(Date.now() + 86400000),
    totalSeats: 4,
    availableSeats: 2,
    farePerSeat: 15,
    status,
  })) as unknown as { id: string };
  const booking = (await Booking.create({
    tripId: trip.id,
    passengerId: PASSENGER_ID,
    seatNumber: 2,
    seatsBooked: 1,
    agreedFare: 15,
    currency: 'JOD',
    status: 'confirmed',
    paymentStatus: 'pending',
    referenceCode: 'MSR-TEST1',
  })) as unknown as { id: string };
  return { tripId: trip.id, bookingId: booking.id };
}

beforeEach(async () => {
  await (Rating as unknown as { destroy: (opts: unknown) => Promise<void> }).destroy({
    where: {},
    force: true,
  });
  await (Booking as unknown as { destroy: (opts: unknown) => Promise<void> }).destroy({
    where: {},
    force: true,
  });
  await (TripSeat as unknown as { destroy: (opts: unknown) => Promise<void> }).destroy({
    where: {},
    force: true,
  });
  await (Trip as unknown as { destroy: (opts: unknown) => Promise<void> }).destroy({
    where: {},
    force: true,
  });
  await (Vehicle as unknown as { destroy: (opts: unknown) => Promise<void> }).destroy({
    where: {},
    force: true,
  });
  await (DriverProfile as unknown as { destroy: (opts: unknown) => Promise<void> }).destroy({
    where: { driverId: DRIVER_ID },
    force: true,
  });
  await (User as unknown as { destroy: (opts: unknown) => Promise<void> }).destroy({
    where: { id: [DRIVER_ID, PASSENGER_ID] },
    force: true,
  });

  await (User as unknown as { create: (data: unknown) => Promise<void> }).create({
    id: DRIVER_ID,
    fullName: 'Stats Driver',
    phone: '+962795559070',
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await (User as unknown as { create: (data: unknown) => Promise<void> }).create({
    id: PASSENGER_ID,
    fullName: 'Stats Passenger',
    phone: '+962795559071',
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await (Vehicle as unknown as { create: (data: unknown) => Promise<void> }).create({
    id: VEHICLE_ID,
    driverId: DRIVER_ID,
    manufacturer: 'Toyota',
    model: 'Camry',
    vehicleType: 'sedan',
    modelYear: 2023,
    plateNumber: 'STT-101',
    color: 'White',
    seats: 4,
    isVerified: true,
  });

  // host trip/booking required to satisfy the ratings.booking_id FK
  const host = await createHostTrip();
  hostTrip = host;
});

function createCompletedTrips(count: number): Promise<unknown> {
  const rows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      driverId: DRIVER_ID,
      vehicleId: VEHICLE_ID,
      originCity: 'Amman',
      destinationCity: 'Irbid',
      departureTime: new Date(Date.now() - (i + 1) * 86400000),
      totalSeats: 4,
      availableSeats: 2,
      farePerSeat: 15,
      status: TRIP_STATUS.COMPLETED,
    });
  }
  return (Trip as unknown as { bulkCreate: (rows: unknown[]) => Promise<unknown> }).bulkCreate(rows);
}

function createRatings(onTime: number, late: number): Promise<unknown> {
  const rows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < onTime; i++) {
    rows.push({
      bookingId: hostTrip.bookingId,
      raterId: PASSENGER_ID,
      rateeId: DRIVER_ID,
      stars: 5,
      wasLate: false,
      isVisible: true,
    });
  }
  for (let i = 0; i < late; i++) {
    rows.push({
      bookingId: hostTrip.bookingId,
      raterId: PASSENGER_ID,
      rateeId: DRIVER_ID,
      stars: 3,
      wasLate: true,
      isVisible: true,
    });
  }
  return (Rating as unknown as { bulkCreate: (rows: unknown[]) => Promise<unknown> }).bulkCreate(rows);
}

describe('driverStatsService.recomputeForDriver', () => {
  it('writes totalTrips, punctualityRate and professional flag back to the profile', async () => {
    await createCompletedTrips(3);
    await createRatings(4, 1); // 80% on time

    const result = (await recomputeForDriver(DRIVER_ID)) as {
      completedTrips: number;
      punctualityRate: number | null;
      professionalDriver: boolean;
    };

    expect(result.completedTrips).toBe(3);
    expect(result.punctualityRate).toBe(80);
    expect(result.professionalDriver).toBe(false);

    const profile = (await (DriverProfile as unknown as {
      findOne: (opts: unknown) => Promise<unknown>;
    }).findOne({ where: { driverId: DRIVER_ID } })) as {
      totalTrips: number;
      punctualityRate: string | number | null;
      professionalDriver: boolean;
    };
    expect(profile.totalTrips).toBe(3);
    expect(Number(profile.punctualityRate)).toBe(80);
    expect(profile.professionalDriver).toBe(false);
  });

  it('marks a driver professional with enough trips and high punctuality', async () => {
    await createCompletedTrips(20);
    await createRatings(10, 0); // 100% on time

    const result = (await recomputeForDriver(DRIVER_ID)) as { professionalDriver: boolean };

    expect(result.professionalDriver).toBe(true);
  });

  it('handles no activity by zeroing stats with null punctuality', async () => {
    const result = (await recomputeForDriver(DRIVER_ID)) as {
      completedTrips: number;
      punctualityRate: number | null;
      professionalDriver: boolean;
    };

    expect(result.completedTrips).toBe(0);
    expect(result.punctualityRate).toBeNull();
    expect(result.professionalDriver).toBe(false);

    const profile = await (DriverProfile as unknown as {
      findOne: (opts: unknown) => Promise<unknown>;
    }).findOne({ where: { driverId: DRIVER_ID } });
    expect(profile).toBeTruthy();
  });

  it('recomputes for every driver with activity via recomputeAllDrivers', async () => {
    await createCompletedTrips(1);
    const results = (await recomputeAllDrivers()) as Array<{
      driverId: string;
      completedTrips: number;
    }>;

    expect(Array.isArray(results)).toBe(true);
    const ours = results.find((r) => r.driverId === DRIVER_ID);
    expect(ours).toBeDefined();
    expect(ours?.completedTrips).toBe(1);
  });
});
