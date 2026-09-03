"use strict";
const { getAgent } = require('../setup/setup');
const { User, Vehicle, Trip, Booking, Rating, Penalty, Complaint, DriverProfile, DriverSubscription, UploadedImage, SubscriptionPlan, } = require('../../Models');
const { TRIP_STATUS, BOOKING_STATUS, COMPLAINT_STATUS, PENALTY_TYPES } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');
const ADMIN_ID = 'a3000000-0000-4000-8000-000000000001';
const DRIVER_ID = 'a3000000-0000-4000-8000-000000000002';
const PASSENGER_ID = 'a3000000-0000-4000-8000-000000000003';
const VEHICLE_ID = 'b3000000-0000-4000-8000-000000000001';
const IMG_ID_FRONT = 9001;
const IMG_ID_REG = 9010;
const IMG_ID_PHOTO_FRONT = 9020;
let adminToken;
const sequelize = require('../../config/database');
async function cleanAll() {
    await sequelize.query(`
    TRUNCATE TABLE
      "document_reviews",
      "bookings",
      "ratings",
      "complaints",
      "penalties",
      "trips",
      "vehicles",
      "driver_subscriptions",
      "driver_profiles",
      "subscription_plans",
      "uploaded_images",
      "users",
      "subscription_transactions",
      "payment_methods",
      "support_tickets",
      "support_ticket_messages",
      "notifications",
      "notification_settings",
      "messages",
      "sos_events",
      "trip_locations",
      "favorite_drivers",
      "favorite_routes",
      "trip_attributes",
      "trip_stops",
      "trip_seats",
      "delay_events",
      "ride_requests",
      "request_offers",
      "deletion_requests",
      "verification_status_changes"
    RESTART IDENTITY CASCADE;
  `);
}
async function seedDossier() {
    await User.bulkCreate([
        { id: ADMIN_ID, fullName: 'Admin', phone: '+962700003001', role: 'admin', passwordHash: 'x', isVerified: true },
        {
            id: DRIVER_ID, fullName: 'Ø£Ø­Ù…Ø¯ Ù…Ø­Ù…Ø¯', phone: '+962780003002', role: 'driver',
            passwordHash: 'x', isVerified: true, verificationStatus: 'approved', status: 'active',
            age: 26, avatarUrl: 'http://img/avatar.png', avgRating: 4.8,
        },
        { id: PASSENGER_ID, fullName: 'Sara Passenger', phone: '+962780003003', role: 'passenger', passwordHash: 'x', isVerified: true },
    ]);
    await UploadedImage.bulkCreate([
        { id: IMG_ID_FRONT, hash: `hash-front-${Date.now()}`, url: 'http://img/id_front.jpg', filename: 'a.jpg', mimetype: 'image/jpeg', createdat: new Date('2026-08-01T10:00:00Z'), updatedat: new Date('2026-08-01T10:00:00Z') },
        { id: IMG_ID_REG, hash: `hash-reg-${Date.now()}`, url: 'http://img/registration.jpg', filename: 'b.jpg', mimetype: 'image/jpeg', createdat: new Date('2026-08-02T10:00:00Z'), updatedat: new Date('2026-08-02T10:00:00Z') },
        { id: IMG_ID_PHOTO_FRONT, hash: `hash-photo-${Date.now()}`, url: 'http://img/car_front.jpg', filename: 'c.jpg', mimetype: 'image/jpeg', createdat: new Date('2026-08-03T10:00:00Z'), updatedat: new Date('2026-08-03T10:00:00Z') },
    ]);
    await DriverProfile.create({ driverId: DRIVER_ID, userIdentificationFront: IMG_ID_FRONT });
    await Vehicle.create({
        id: VEHICLE_ID, driverId: DRIVER_ID, manufacturer: 'Hyundai', model: 'Elantra',
        vehicleType: 'sedan', modelYear: 2021, plateNumber: `D-${Date.now() % 100000}`,
        color: 'White', seats: 4, isVerified: true,
        registrationDocFront: IMG_ID_REG, vehiclePhotoFront: IMG_ID_PHOTO_FRONT,
    });
    const plan = await SubscriptionPlan.create({
        name: `Pro-${Date.now()}`, periodDays: 30, percentageCut: 15.5, cost: 10,
        features: [], isFree: false, isActive: true,
    });
    await DriverSubscription.create({
        driverId: DRIVER_ID, planId: plan.id,
        planName: plan.name, planPeriodDays: plan.periodDays,
        planPercentageCut: plan.percentageCut, planCost: plan.cost,
        paymentMethod: { kind: 'cash' }, status: 'active',
        activatedAt: new Date('2026-08-01T00:00:00Z'), expiresAt: new Date('2026-08-31T00:00:00Z'),
    });
    const month = new Date();
    const prevMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1));
    const twoMonthsAgo = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 2, 1));
    const tripInMonth = await Trip.create({
        driverId: DRIVER_ID, vehicleId: VEHICLE_ID,
        originCity: 'Amman', destinationCity: 'Irbid',
        departureTime: new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 15, 12)),
        totalSeats: 4, availableSeats: 4, farePerSeat: 10, status: TRIP_STATUS.PUBLISHED,
    });
    const completedTrip = await Trip.create({
        driverId: DRIVER_ID, vehicleId: VEHICLE_ID,
        originCity: 'Irbid', destinationCity: 'Amman',
        departureTime: new Date(Date.UTC(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth(), 15, 12)),
        totalSeats: 4, availableSeats: 4, farePerSeat: 9, status: TRIP_STATUS.COMPLETED,
    });
    await Trip.create({
        driverId: DRIVER_ID, vehicleId: VEHICLE_ID,
        originCity: 'Amman', destinationCity: 'Aqaba',
        departureTime: new Date(Date.UTC(twoMonthsAgo.getUTCFullYear(), twoMonthsAgo.getUTCMonth(), 15, 12)),
        totalSeats: 4, availableSeats: 4, farePerSeat: 30, status: TRIP_STATUS.CANCELLED,
    });
    await Booking.create({
        tripId: tripInMonth.id, passengerId: PASSENGER_ID,
        seatsBooked: 3, agreedFare: 30, referenceCode: `RD${Date.now() % 1000000}`,
        status: BOOKING_STATUS.CONFIRMED,
    });
    const bookingCompleted = await Booking.create({
        tripId: completedTrip.id, passengerId: PASSENGER_ID,
        seatsBooked: 1, agreedFare: 9, referenceCode: `RE${Date.now() % 1000000}`,
        status: BOOKING_STATUS.COMPLETED,
    });
    await Rating.create({
        bookingId: bookingCompleted.id, raterId: PASSENGER_ID, rateeId: DRIVER_ID,
        stars: 5, review: 'Great ride', tags: ['Clean Car', 'Safe Driving'],
    });
    await Rating.create({
        bookingId: bookingCompleted.id, raterId: PASSENGER_ID, rateeId: DRIVER_ID,
        stars: 4, review: 'Good', tags: ['Clean Car'], createdat: new Date(Date.now() - 86400000),
    });
    await Penalty.create({
        userId: DRIVER_ID, type: PENALTY_TYPES.WARNING, penaltyType: 'speeding',
        reason: 'Speeding complaint', startsAt: new Date(Date.now() - 3 * 86400000),
        issuedBy: ADMIN_ID,
    });
    await Complaint.create({
        reporterId: PASSENGER_ID, accusedId: DRIVER_ID,
        category: 'misconduct', description: 'rude behavior', status: COMPLAINT_STATUS.OPEN,
    });
    await Complaint.create({
        reporterId: DRIVER_ID, accusedId: PASSENGER_ID,
        category: 'no_show', description: 'passenger no show', status: COMPLAINT_STATUS.RESOLVED,
    });
}
beforeAll(async () => {
    adminToken = generateAccessToken({ id: ADMIN_ID, role: 'admin' });
});
beforeEach(async () => {
    await cleanAll();
    await seedDossier();
});
describe('GET /api/admin/dashboard/drivers/:driver_id â€” header', () => {
    it('returns identity, derived status, lifetime stats and ratings', async () => {
        const res = await getAgent()
            .get(`/api/admin/dashboard/drivers/${DRIVER_ID}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            name: 'Ø£Ø­Ù…Ø¯ Ù…Ø­Ù…Ø¯',
            account_status: 'active',
            balance: 0,
            reviews_count: 2,
        });
        expect(res.body.trip_stats).toEqual({ total_trips: 3, completed_trips: 1, canceled_trips: 1 });
        expect(res.body.avg_rating).toBeCloseTo(4.5, 1);
    });
    it.skip('returns 404 for a nonexistent or non-driver id', async () => {
        const res = await getAgent()
            .get('/api/admin/dashboard/drivers/00000000-0000-4000-8000-000000000099')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(404);
    });
});
describe('GET /api/admin/dashboard/drivers/:driver_id/overview', () => {
    it('returns personal info, trip statistics and balance details from the latest subscription', async () => {
        const res = await getAgent()
            .get(`/api/admin/dashboard/drivers/${DRIVER_ID}/overview`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.personal_info.name).toBe('Ø£Ø­Ù…Ø¯ Ù…Ø­Ù…Ø¯');
        expect(res.body.trip_statistics.total_trips).toBe(3);
        expect(res.body.balance_details).toMatchObject({
            price_per_month: 10,
            duration_days: 30,
            interest_rate: 15.5,
        });
    });
});
describe('GET /api/admin/dashboard/drivers/:driver_id/trips', () => {
    it('filters by status and includes reservation/passenger aggregates', async () => {
        const res = await getAgent()
            .get(`/api/admin/dashboard/drivers/${DRIVER_ID}/trips?status=completed`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].status).toBe('completed');
        expect(res.body.data[0].reservations_count).toBe(1);
        expect(res.body.data[0].price).toBe(9);
    });
    it('filters by month (YYYY-MM)', async () => {
        const now = new Date();
        const monthParam = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
        const res = await getAgent()
            .get(`/api/admin/dashboard/drivers/${DRIVER_ID}/trips?month=${monthParam}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].passengers_count).toBe(3);
    });
});
describe('GET /api/admin/dashboard/drivers/:driver_id/evaluations', () => {
    it('returns summary, full 5â†’1 distribution, top tags and paginated reviews', async () => {
        const res = await getAgent()
            .get(`/api/admin/dashboard/drivers/${DRIVER_ID}/evaluations`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.summary).toMatchObject({ total_reviews: 2 });
        expect(res.body.distribution).toHaveLength(5);
        const byStar = Object.fromEntries(res.body.distribution.map((d) => [d.rating, d.count]));
        expect(byStar[5]).toBe(1);
        expect(byStar[4]).toBe(1);
        expect(byStar[3]).toBe(0);
        expect(res.body.top_tags[0]).toBe('Clean Car');
        expect(res.body.reviews[0].passenger_name).toBe('Sara Passenger');
        expect(res.body.reviews[0].comment).toBe('Great ride');
    });
});
describe('GET /api/admin/dashboard/drivers/:driver_id/account-log', () => {
    it('merges penalties and complaints with counters', async () => {
        const res = await getAgent()
            .get(`/api/admin/dashboard/drivers/${DRIVER_ID}/account-log`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.summary).toMatchObject({
            violations: 1, warnings: 1, suspensions: 0,
            complaints_against: 1, complaints_by: 1,
        });
        const types = res.body.log.map((l) => l.type);
        expect(types).toContain('warning');
        expect(types).toContain('enquiry');
        const enquiryAgainst = res.body.log.find((l) => l.type === 'enquiry' && l.direction === 'against_driver');
        expect(enquiryAgainst.status).toBe('pending');
    });
});
describe('GET /api/admin/dashboard/drivers/:driver_id/car + /documents', () => {
    it('car tab returns info, photos and per-document statuses', async () => {
        const res = await getAgent()
            .get(`/api/admin/dashboard/drivers/${DRIVER_ID}/car`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.car_info).toMatchObject({ make: 'Hyundai', model: 'Elantra', year: 2021, seats: 4 });
        expect(res.body.car_photos.front).toBe('http://img/car_front.jpg');
        const regFront = res.body.document_status.find((d) => d.key === 'registration_front');
        expect(regFront.status).toBe('pending');
        expect(res.body.vehicle_verified).toBe(true);
    });
    it('documents tab groups personal/vehicle docs with derived statuses incl. missing insurance', async () => {
        const res = await getAgent()
            .get(`/api/admin/dashboard/drivers/${DRIVER_ID}/documents`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        const idFront = res.body.personal_documents.find((d) => d.key === 'id_front');
        expect(idFront).toMatchObject({ document_url: 'http://img/id_front.jpg', status: 'pending' });
        const licenseBack = res.body.personal_documents.find((d) => d.key === 'license_back');
        expect(licenseBack.status).toBe('missing');
        const insurance = res.body.vehicle_documents.find((d) => d.key === 'insurance');
        expect(insurance.status).toBe('missing');
        const regFront = res.body.vehicle_documents.find((d) => d.key === 'registration_front');
        expect(regFront.status).toBe('pending');
    });
});
//# sourceMappingURL=adminDriverDossier.test.js.map