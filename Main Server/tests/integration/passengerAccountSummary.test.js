const { getAgent } = require('../setup/setup');
const { Op } = require('sequelize');
const { User, Penalty, Complaint } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { PENALTY_TYPES } = require('../../config/constants');

const PASSENGER_ID = 'fb000000-0000-4000-8000-000000000003';
const OTHER_USER_ID = 'fb000000-0000-4000-8000-000000000004';
const PHONE = '+962795131103';
const OTHER_PHONE = '+962795131104';

let passengerToken;

beforeEach(async () => {
  await Penalty.destroy({ where: {}, force: true });
  await Complaint.destroy({ where: {}, force: true });
  await User.destroy({ where: { [Op.or]: [{ phone: PHONE }, { phone: OTHER_PHONE }] }, force: true });

  await User.create({
    id: PASSENGER_ID,
    fullName: 'Summary Passenger',
    phone: PHONE,
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await User.create({
    id: OTHER_USER_ID,
    fullName: 'Other User',
    phone: OTHER_PHONE,
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });

  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

describe('US8 - passenger account summary', () => {
  it('should return zeroed counts when there are no penalties or complaints', async () => {
    const res = await getAgent()
      .get('/api/profile/passenger/account-summary')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.account_summary).toEqual([
      { type: 'alerts', count: 0 },
      { type: 'violations', count: 0 },
      { type: 'sanctions', count: 0 },
      { type: 'complaints', count: 0 },
    ]);
  });

  it('should aggregate penalties on the user and complaints he filed', async () => {
    await Penalty.bulkCreate([
      { userId: PASSENGER_ID, type: PENALTY_TYPES.WARNING, reason: 'Late arrival', startsAt: new Date() },
      { userId: PASSENGER_ID, type: PENALTY_TYPES.WARNING, reason: 'No-show', startsAt: new Date() },
      { userId: PASSENGER_ID, type: PENALTY_TYPES.SUSPENSION, reason: 'Abuse', startsAt: new Date(), endsAt: new Date(Date.now() + 86400000) },
      { userId: PASSENGER_ID, type: PENALTY_TYPES.BAN, reason: 'Fraud', startsAt: new Date() },
      { userId: PASSENGER_ID, type: PENALTY_TYPES.WARNING, penaltyType: 'violation', reason: 'Unpaid fare', startsAt: new Date() },
      { userId: PASSENGER_ID, type: PENALTY_TYPES.SUSPENSION, penaltyType: 'violation', reason: 'Recurring abuse', startsAt: new Date(), endsAt: new Date(Date.now() + 86400000) },
    ]);
    await Penalty.create({
      userId: OTHER_USER_ID,
      type: PENALTY_TYPES.BAN,
      reason: 'Someone else ban',
      startsAt: new Date(),
    });
    await Complaint.bulkCreate([
      { reporterId: PASSENGER_ID, accusedId: OTHER_USER_ID, category: 'no_show', description: 'Driver never came' },
      { reporterId: PASSENGER_ID, accusedId: OTHER_USER_ID, category: 'fare', description: 'Wrong fare charged' },
      { reporterId: OTHER_USER_ID, accusedId: PASSENGER_ID, category: 'behavior', description: 'Filed against the passenger' },
    ]);

    const res = await getAgent()
      .get('/api/profile/passenger/account-summary')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.account_summary).toEqual([
      { type: 'alerts', count: 3 },
      { type: 'violations', count: 2 },
      { type: 'sanctions', count: 3 },
      { type: 'complaints', count: 2 },
    ]);
  });

  it('should reject drivers', async () => {
    const driverToken = generateAccessToken({ id: OTHER_USER_ID, role: 'driver' });
    const res = await getAgent()
      .get('/api/profile/passenger/account-summary')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(403);
  });
});