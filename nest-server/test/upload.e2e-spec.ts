// 1:1 port of Main Server/tests/integration/upload.test.js (Wave 1.1).
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { truncateAll } from '../src/test/db.js';
import { generateAccessToken } from '../src/test/jwt.js';
import { createTestApp, type TestContext } from '../src/test/test-app.js';

const USER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d91';
const TMP_UPLOAD_DIR = join(tmpdir(), 'nest-upload-test');

process.env.UPLOAD_PROVIDER = 'local';
process.env.LOCAL_UPLOAD_DIR = TMP_UPLOAD_DIR;
process.env.LOCAL_UPLOAD_BASE_URL = '/uploads';

function pngBuffer(): Buffer {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}

describe('POST /api/upload', () => {
  let ctx: TestContext;
  let userToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    rmSync(TMP_UPLOAD_DIR, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await truncateAll(ctx.prisma);
    await ctx.prisma.user.create({
      data: {
        id: USER_ID,
        fullName: 'Upload Tester',
        phone: '+962790000001',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
      },
    });
    userToken = generateAccessToken({ id: USER_ID, role: 'passenger' });
    if (!existsSync(TMP_UPLOAD_DIR)) mkdirSync(TMP_UPLOAD_DIR, { recursive: true });
  });

  it('should upload a valid PNG and return its url', async () => {
    const res = await ctx.agent
      .post('/api/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', pngBuffer(), { filename: 'photo.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/\/uploads\/.*\.png$/);
    expect(res.body.filename).toBeTruthy();
    expect(res.body.cached).toBe(false);

    const saved = await ctx.prisma.uploadedImage.findFirst({
      where: { filename: res.body.filename as string },
    });
    expect(saved).not.toBeNull();

    const fileRes = await ctx.agent.get(res.body.url as string);
    expect(fileRes.status).toBe(200);
    expect(fileRes.headers['content-type']).toContain('image/png');
  });

  it('should reject a non-image file with 400 INVALID_FILE_TYPE', async () => {
    const res = await ctx.agent
      .post('/api/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', Buffer.from('plain text'), { filename: 'notes.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 'error', code: 'INVALID_FILE_TYPE' });
    expect(res.body.message).toMatch(/Only JPEG, PNG, WebP, and GIF/);
  });

  it('should reject files larger than 10MB with 413 FILE_TOO_LARGE', async () => {
    const big = Buffer.alloc(10 * 1024 * 1024 + 1, 1);
    const res = await ctx.agent
      .post('/api/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('file', big, { filename: 'big.png', contentType: 'image/png' });

    expect(res.status).toBe(413);
    expect(res.body).toMatchObject({
      status: 'error',
      message: 'File too large. Maximum allowed size is 10 MB.',
      code: 'FILE_TOO_LARGE',
    });
  });

  it('should return 400 when no file is attached', async () => {
    const res = await ctx.agent.post('/api/upload').set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  it('should require authentication', async () => {
    const res = await ctx.agent
      .post('/api/upload')
      .attach('file', pngBuffer(), { filename: 'photo.png', contentType: 'image/png' });
    expect(res.status).toBe(401);
  });
});
