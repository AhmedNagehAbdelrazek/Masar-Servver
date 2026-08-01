const { getAgent } = require('../setup/setup');
const { User, Penalty } = require('../../Models');
const { USER_STATUS, PENALTY_TYPES } = require('../../config/constants');
const { generateAccessToken } = require('../setup/helpers');

const DRIVER_PHONE = '+962791111111';
const DRIVER_ID = '550e8400-e29b-41d4-a716-446655440001';

let driverToken;

beforeEach(async () => {
  await Penalty.destroy({ where: {}, force: true });
  await User.destroy({ where: { phone: DRIVER_PHONE }, force: true });

  await User.create({
    id: DRIVER_ID,
    fullName: 'Test Driver',
    phone: DRIVER_PHONE,
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
    status: USER_STATUS.SUSPENDED,
  });

  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});

function futureDate(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

describe('US4 - Driver Penalties', () => {
  describe('GET /api/driver/penalties', () => {
    it('should list active and expired penalties with enforcement_state', async () => {
      await Penalty.create({
        userId: DRIVER_ID,
        type: PENALTY_TYPES.SUSPENSION,
        reason: 'Two no-show incidents',
        startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endsAt: futureDate(5),
        issuedBy: '550e8400-e29b-41d4-a716-446655440099',
      });
      await Penalty.create({
        userId: DRIVER_ID,
        type: PENALTY_TYPES.WARNING,
        reason: 'Minor lateness',
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endsAt: null,
        issuedBy: '550e8400-e29b-41d4-a716-446655440099',
      });

      const res = await getAgent()
        .get('/api/driver/penalties')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].type).toBeDefined();
      expect(res.body.data[0].reason).toBeDefined();
      expect(res.body.data[0].starts_at).toBeDefined();
      expect(res.body.data[0].enforcement_state).toBe(USER_STATUS.SUSPENDED);
      expect(res.body.pagination.total).toBe(2);
    });

    it('should filter to active penalties only', async () => {
      await Penalty.create({
        userId: DRIVER_ID,
        type: PENALTY_TYPES.SUSPENSION,
        reason: 'Active suspension',
        startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endsAt: futureDate(5),
        issuedBy: '550e8400-e29b-41d4-a716-446655440099',
      });
      await Penalty.create({
        userId: DRIVER_ID,
        type: PENALTY_TYPES.WARNING,
        reason: 'Expired warning',
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        issuedBy: '550e8400-e29b-41d4-a716-446655440099',
      });

      const res = await getAgent()
        .get('/api/driver/penalties')
        .query({ active: 'true' })
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].reason).toBe('Active suspension');
    });

    it('should return empty list for a driver with no penalties', async () => {
      const res = await getAgent()
        .get('/api/driver/penalties')
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should reject passenger role with 403', async () => {
      const passengerId = '550e8400-e29b-41d4-a716-446655440002';
      await User.create({
        id: passengerId,
        fullName: 'Passenger',
        phone: '+962792222222',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      });
      const passengerToken = generateAccessToken({ id: passengerId, role: 'passenger' });

      const res = await getAgent()
        .get('/api/driver/penalties')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
