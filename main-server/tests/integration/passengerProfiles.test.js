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
  it('should return personal data and lazily create a profile on first GET', async () => {
    const res = await getAgent()
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.full_name).toBe('Profile Passenger');
    expect(res.body.passenger_profile.age).toBeNull();
    expect(res.body.passenger_profile.gender).toBe('male');
    expect(res.body.passenger_profile.phone).toBe(PASSENGER_PHONE);
    expect(res.body.passenger_profile.national_id).toBeNull();
    expect(res.body.passenger_profile.home_address).toBeNull();
    expect(res.body.passenger_profile.avatar_url).toBeNull();

    const rows = await PassengerProfile.findAll({ where: { passengerId: PASSENGER_ID } });
    expect(rows.length).toBe(1);

    const again = await getAgent()
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(again.status).toBe(200);
    const rowsAfter = await PassengerProfile.findAll({ where: { passengerId: PASSENGER_ID } });
    expect(rowsAfter.length).toBe(1);
  });

  it('should return the stored national id from the profile', async () => {
    await PassengerProfile.create({ passengerId: PASSENGER_ID, nationalID: '9871234567' });

    const res = await getAgent()
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.national_id).toBe('9871234567');
  });

  it('should update and return the home address', async () => {
    const res = await getAgent()
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ home_address: 'Amman, Jabal Amman' });

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.home_address).toBe('Amman, Jabal Amman');

    const fetched = await getAgent()
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(fetched.body.passenger_profile.home_address).toBe('Amman, Jabal Amman');
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

    const rows = await PassengerProfile.findAll({ where: { passengerId: PASSENGER_ID } });
    expect(rows[0].emergencyContacts.length).toBe(1);
    expect(rows[0].savedRoutes).toEqual([{ origin_city: 'Amman', destination_city: 'Irbid' }]);
  });

  it('should update the national id', async () => {
    const res = await getAgent()
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ national_id: '9871234567' });

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.national_id).toBe('9871234567');

    const rows = await PassengerProfile.findAll({ where: { passengerId: PASSENGER_ID } });
    expect(rows[0].nationalID).toBe('9871234567');
  });

  it('should validate enum fields', async () => {
    const res = await getAgent()
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ preferred_gender: 'robot' });

    expect(res.status).toBe(422);
  });

  it('should update and clear the avatar without changing verification', async () => {
    await User.update(
      { verificationStatus: 'approved', isVerified: true },
      { where: { id: PASSENGER_ID } },
    );

    const res = await getAgent()
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ avatar_url: '/uploads/passenger-avatar.jpg' });

    expect(res.status).toBe(200);
    expect(res.body.passenger_profile.avatar_url).toBe('/uploads/passenger-avatar.jpg');

    let stored = await User.findByPk(PASSENGER_ID);
    expect(stored.avatarUrl).toBe('/uploads/passenger-avatar.jpg');
    expect(stored.verificationStatus).toBe('approved');
    expect(stored.isVerified).toBe(true);

    const fetched = await getAgent()
      .get('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.passenger_profile.avatar_url).toBe('/uploads/passenger-avatar.jpg');

    const cleared = await getAgent()
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ avatar_url: null });

    expect(cleared.status).toBe(200);
    expect(cleared.body.passenger_profile.avatar_url).toBeNull();
    stored = await User.findByPk(PASSENGER_ID);
    expect(stored.avatarUrl).toBeNull();
    expect(stored.verificationStatus).toBe('approved');
    expect(stored.isVerified).toBe(true);
  });

  it('should reject a non-string avatar url', async () => {
    const res = await getAgent()
      .put('/api/profile/passenger')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ avatar_url: 123 });

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
