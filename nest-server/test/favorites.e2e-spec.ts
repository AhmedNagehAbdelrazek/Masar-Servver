// 1:1 port of Main Server/tests/integration/favorites.test.js (Wave 1.4).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resetTestState } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const PASSENGER_ID = 'fa000000-0000-4000-8000-000000000001';
const DRIVER1_ID = 'fa000000-0000-4000-8000-000000000002';
const DRIVER2_ID = 'fa000000-0000-4000-8000-000000000003';
const PASSENGER2_ID = 'fa000000-0000-4000-8000-000000000004';

async function createUser(
  ctx: TestContext,
  id: string,
  fullName: string,
  phone: string,
  role: 'passenger' | 'driver',
): Promise<void> {
  await ctx.prisma.user.create({
    data: { id, fullName, phone, countryCode: 'JO', role, passwordHash: 'hashed', isVerified: true },
  });
}

describe('US7 - favorite drivers', () => {
  let ctx: TestContext;
  let passengerToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await createUser(ctx, PASSENGER_ID, 'Fav Passenger', '+962795121101', 'passenger');
    await createUser(ctx, PASSENGER2_ID, 'Fav Passenger Two', '+962795121104', 'passenger');
    await createUser(ctx, DRIVER1_ID, 'Fav Driver One', '+962795121102', 'driver');
    await createUser(ctx, DRIVER2_ID, 'Fav Driver Two', '+962795121103', 'driver');
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  function addDriverFavorite(driverId: string): ReturnType<TestContext['agent']['post']> {
    return ctx.agent
      .post('/api/favorites/drivers')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ driver_id: driverId });
  }

  it('adds a driver as favorite', async () => {
    const res = await addDriverFavorite(DRIVER1_ID);
    expect(res.status).toBe(200);
    expect(res.body.favorite_driver.driver_id).toBe(DRIVER1_ID);
    expect(res.body.favorite_driver.driver_name).toBe('Fav Driver One');
    expect(res.body.created).toBe(true);
  });

  it('is idempotent when adding twice', async () => {
    await addDriverFavorite(DRIVER1_ID);
    const res = await addDriverFavorite(DRIVER1_ID);
    expect(res.status).toBe(200);
    expect(res.body.created).toBe(false);

    const list = await ctx.agent
      .get('/api/favorites/drivers')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(list.body.data.length).toBe(1);
  });

  it('rejects favoriting a non-driver user', async () => {
    const res = await addDriverFavorite(PASSENGER2_ID);
    expect(res.status).toBe(404);
  });

  it('validates the payload', async () => {
    const res = await ctx.agent
      .post('/api/favorites/drivers')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({});
    expect(res.status).toBe(422);
  });

  it('removes a favorite driver', async () => {
    await addDriverFavorite(DRIVER1_ID);

    const res = await ctx.agent
      .delete(`/api/favorites/drivers/${DRIVER1_ID}`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(200);

    const again = await ctx.agent
      .delete(`/api/favorites/drivers/${DRIVER1_ID}`)
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(again.status).toBe(404);
  });

  it('lists favorites with pagination envelope', async () => {
    await addDriverFavorite(DRIVER1_ID);
    await addDriverFavorite(DRIVER2_ID);

    const res = await ctx.agent
      .get('/api/favorites/drivers')
      .set('Authorization', `Bearer ${passengerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.data.map((f: { driver_name: string }) => f.driver_name)).toContain(
      'Fav Driver Two',
    );
  });
});

describe('US7 - favorite routes', () => {
  let ctx: TestContext;
  let passengerToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await resetTestState(ctx.prisma, ctx.redis);
    await createUser(ctx, PASSENGER_ID, 'Fav Passenger', '+962795121101', 'passenger');
    passengerToken = generateAccessToken({ id: PASSENGER_ID, role: 'passenger' });
  });

  function addRoute(overrides: Record<string, unknown> = {}): ReturnType<TestContext['agent']['post']> {
    return ctx.agent
      .post('/api/favorites/routes')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ origin_city: 'Amman', destination_city: 'Irbid', label: 'Weekend trips', ...overrides });
  }

  it('adds a favorite route', async () => {
    const res = await addRoute();
    expect(res.status).toBe(201);
    expect(res.body.favorite_route.origin_city).toBe('Amman');
    expect(res.body.favorite_route.destination_city).toBe('Irbid');
    expect(res.body.favorite_route.label).toBe('Weekend trips');
  });

  it('deduplicates identical routes and updates the label', async () => {
    await addRoute();
    const res = await addRoute({ label: 'Updated label' });
    expect(res.status).toBe(201);
    expect(res.body.favorite_route.label).toBe('Updated label');

    const list = await ctx.agent
      .get('/api/favorites/routes')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(list.body.data.length).toBe(1);
  });

  it('removes a route by its city pair', async () => {
    await addRoute();

    const res = await ctx.agent
      .delete('/api/favorites/routes/Amman/Irbid')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(res.status).toBe(200);

    const again = await ctx.agent
      .delete('/api/favorites/routes/Amman/Irbid')
      .set('Authorization', `Bearer ${passengerToken}`);
    expect(again.status).toBe(404);
  });

  it('validates route payloads', async () => {
    const res = await ctx.agent
      .post('/api/favorites/routes')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ destination_city: 'Irbid' });
    expect(res.status).toBe(422);
  });

  it('rejects unauthenticated access', async () => {
    const res = await ctx.agent.get('/api/favorites/drivers');
    expect(res.status).toBe(401);
  });
});
