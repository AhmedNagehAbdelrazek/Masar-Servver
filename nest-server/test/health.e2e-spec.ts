// Wave 0 acceptance: full-app boot, public health, guarded routes reject
// anonymous callers with the Express-compatible 401 envelope.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { truncateAll } from '../src/test/db.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

describe('health (Wave 0 harness proof)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
    await truncateAll(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /api/healthz is public', async () => {
    const res = await ctx.agent.get('/api/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/auth/me without token is 401 with envelope', async () => {
    const res = await ctx.agent.get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('unknown routes are 404 with envelope', async () => {
    const res = await ctx.agent.get('/api/nope');
    expect(res.status).toBe(404);
  });
});
