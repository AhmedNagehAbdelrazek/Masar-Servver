const { getAgent } = require('../setup/setup');
const { User, PassengerProfile } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');

const PASSENGER_ID = 'fb000000-0000-4000-8000-000000000001';
const DRIVER_ID = 'fb000000-0000-4000-8000-000000000002';
const PASSENGER_PHONE = '+962795131101';
const DRIVER_PHONE = '+962795131102';

let passengerToken;
let driverToken;

beforeEach(async () => {
  await PassengerProfile.destroy({ where: {}, force: true });
  await User.destroy({ where: { phone: [PASSENGER_PHONE, DRIVER_PHONE] }, force: true });

  await User.create({
    id: PASSENGER_ID,
    fullName: 'Profile Passenger',
    phone: PASSENGER_PHONE,
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await User.create({
    id: DRIVER_ID,
    fullName: 'Profile Driver',
    phone: DRIVER_PHONE,
    countryCode: 'JO',
    role: 'driver',
    passwordHash: 'hashed',
    isVerified: true,
  });

  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  driverToken = generateAccessToken({ id: DRIVER_ID, role: 'driver' });
});

describe('US8 - passenger profile auto-creation', () => {
  it('should lazily create a profile with defaults on first GET', async () => {
    const res = await getAgent()
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.passenger_id).toBe(PASSENGER_ID);
    expect(res.body.passenger_profile.preferred_gender).toBe('any');
    expect(res.body.passenger_profile.smoking_preference).toBe('no_preference');
    expect(res.body.passenger_profile.saved_routes).toEqual([]);
    expect(res.body.passenger_profile.emergency_contacts).toEqual([]);

    const rows = await PassengerProfile.findAll({ where: { passengerId: PASSENGER_ID } });
    expect(rows.length).toBe(1);

    const again = await getAgent()
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(again.status).toBe(200);
    const rowsAfter = await PassengerProfile.findAll({ where: { passengerId: PASSENGER_ID } });
    expect(rowsAfter.length).toBe(1);
  });

  it('should reject drivers', async () => {
    const res = await getAgent()
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.status).toBe(403);
  });
});

describe('US8 - updating the passenger profile', () => {
  it('should update individual fields partially', async () => {
    await getAgent()
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);

    const res = await getAgent()
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ preferred_gender: 'female' });

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.preferred_gender).toBe('female');
    expect(res.body.passenger_profile.smoking_preference).toBe('no_preference');
  });

  it('should store saved routes and emergency contacts', async () => {
    await getAgent()
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);

    const res = await getAgent()
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        saved_routes: [{ origin_city: 'Amman', destination_city: 'Irbid' }],
        emergency_contacts: [{ name: 'Mom', phone: '+962790000000' }],
      });

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.saved_routes).toEqual([
      { origin_city: 'Amman', destination_city: 'Irbid' },
    ]);
    expect(res.body.passenger_profile.emergency_contacts[0].name).toBe('Mom');

    const fetched = await getAgent()
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(fetched.body.passenger_profile.emergency_contacts.length).toBe(1);
  });

  it('should validate enum fields', async () => {
    const res = await getAgent()
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ preferred_gender: 'robot' });

    expect(res.status).toBe(422);
  });

  it('should reject empty updates', async () => {
    const res = await getAgent()
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({});

    expect(res.status).toBe(422);
  });
});
