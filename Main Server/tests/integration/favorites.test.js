const { getAgent } = require('../setup/setup');
const {
  User,
  FavoriteDriver,
  FavoriteRoute,
  SubscriptionPlan,
  DriverSubscription,
} = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { SUBSCRIPTION_STATUS } = require('../../config/constants');

const PASSENGER_ID = 'fa000000-0000-4000-8000-000000000001';
const DRIVER1_ID = 'fa000000-0000-4000-8000-000000000002';
const DRIVER2_ID = 'fa000000-0000-4000-8000-000000000003';
const PASSENGER2_ID = 'fa000000-0000-4000-8000-000000000004';

const PASSENGER_PHONE = '+962795121101';
const DRIVER1_PHONE = '+962795121102';
const DRIVER2_PHONE = '+962795121103';
const PASSENGER2_PHONE = '+962795121104';

let passengerToken;

beforeEach(async () => {
  await FavoriteDriver.destroy({ where: {}, force: true });
  await FavoriteRoute.destroy({ where: {}, force: true });
  await DriverSubscription.destroy({ where: {}, force: true }).catch(() => {});
  await User.destroy({
    where: { phone: [PASSENGER_PHONE, DRIVER1_PHONE, DRIVER2_PHONE, PASSENGER2_PHONE] },
    force: true,
  });

  await User.create({
    id: PASSENGER_ID,
    fullName: 'Fav Passenger',
    phone: PASSENGER_PHONE,
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });
  await User.create({
    id: PASSENGER2_ID,
    fullName: 'Fav Passenger Two',
    phone: PASSENGER2_PHONE,
    countryCode: 'JO',
    role: 'passenger',
    passwordHash: 'hashed',
    isVerified: true,
  });
  for (const d of [
    { id: DRIVER1_ID, fullName: 'Fav Driver One', phone: DRIVER1_PHONE },
    { id: DRIVER2_ID, fullName: 'Fav Driver Two', phone: DRIVER2_PHONE },
  ]) {
    await User.create({
      id: d.id,
      fullName: d.fullName,
      phone: d.phone,
      countryCode: 'JO',
      role: 'driver',
      passwordHash: 'hashed',
      isVerified: true,
    });
  }

  passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
});

function addDriverFavorite(driverId) {
  return getAgent()
    .post('/api/favorites/drivers')
    .set('Authorization', `Bearer ${passengerToken}`)
    .send({ driver_id: driverId });
}

describe('US7 - favorite drivers', () => {
  it('should add a driver as favorite', async () => {
    const res = await addDriverFavorite(DRIVER1_ID);

    expect(res.status).toBe(200);
    expect(res.body.favorite_driver.driver_id).toBe(DRIVER1_ID);
    expect(res.body.favorite_driver.driver_name).toBe('Fav Driver One');
    expect(res.body.created).toBe(true);
  });

  it('should be idempotent when adding twice', async () => {
    await addDriverFavorite(DRIVER1_ID);
    const res = await addDriverFavorite(DRIVER1_ID);

    expect(res.status).toBe(200);
    expect(res.body.created).toBe(false);

    const list = await getAgent()
      .get('/api/favorites/drivers')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(list.body.data.length).toBe(1);
  });

  it('should reject favoriting a non-driver user', async () => {
    const res = await addDriverFavorite(PASSENGER2_ID);
    expect(res.status).toBe(404);
  });

  it('should validate the payload', async () => {
    const res = await getAgent()
      .post('/api/favorites/drivers')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({});
    expect(res.status).toBe(422);
  });

  it('should remove a favorite driver', async () => {
    await addDriverFavorite(DRIVER1_ID);

    const res = await getAgent()
      .delete(`/api/favorites/drivers/${DRIVER1_ID}`)
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);

    const again = await getAgent()
      .delete(`/api/favorites/drivers/${DRIVER1_ID}`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(again.status).toBe(404);
  });

  it('should list favorites with pagination envelope', async () => {
    await addDriverFavorite(DRIVER1_ID);
    await addDriverFavorite(DRIVER2_ID);

    const res = await getAgent()
      .get('/api/favorites/drivers')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.data.map((f) => f.driver_name)).toContain('Fav Driver Two');
  });
});

describe('US7 - favorite routes', () => {
  function addRoute(overrides = {}) {
    return getAgent()
      .post('/api/favorites/routes')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        origin_city: 'Amman',
        destination_city: 'Irbid',
        label: 'Weekend trips',
        ...overrides,
      });
  }

  it('should add a favorite route', async () => {
    const res = await addRoute();

    expect(res.status).toBe(201);
    expect(res.body.favorite_route.origin_city).toBe('Amman');
    expect(res.body.favorite_route.destination_city).toBe('Irbid');
    expect(res.body.favorite_route.label).toBe('Weekend trips');
  });

  it('should deduplicate identical routes and update the label', async () => {
    await addRoute();
    const res = await addRoute({ label: 'Updated label' });

    expect(res.status).toBe(201);
    expect(res.body.favorite_route.label).toBe('Updated label');

    const list = await getAgent()
      .get('/api/favorites/routes')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(list.body.data.length).toBe(1);
  });

  it('should remove a route by its city pair', async () => {
    await addRoute();

    const res = await getAgent()
      .delete('/api/favorites/routes/Amman/Irbid')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(200);

    const again = await getAgent()
      .delete('/api/favorites/routes/Amman/Irbid')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(again.status).toBe(404);
  });

  it('should validate route payloads', async () => {
    const res = await getAgent()
      .post('/api/favorites/routes')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ destination_city: 'Irbid' });

    expect(res.status).toBe(422);
  });

  it('should reject unauthenticated access', async () => {
    const res = await getAgent().get('/api/favorites/drivers');
    expect(res.status).toBe(401);
  });
});
