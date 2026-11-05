"use strict";
const path = require('path');
const fs = require('fs');
const { getAgent } = require('../setup/setup');
const { User, UploadedImage } = require('../../Models');
const { generateAccessToken } = require('../setup/helpers');
const { resetUploader } = require('../../Services/uploaders');
const USER_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4d91';
const TMP_UPLOAD_DIR = path.join(__dirname, '..', '__tmp_uploads__');
process.env.UPLOAD_PROVIDER = 'local';
process.env.LOCAL_UPLOAD_DIR = TMP_UPLOAD_DIR;
process.env.LOCAL_UPLOAD_BASE_URL = '/uploads';
let userToken;
function pngBuffer() {
    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
}
beforeEach(async () => {
    resetUploader();
    await UploadedImage.destroy({ where: {}, force: true });
    await User.destroy({ where: { id: USER_ID }, force: true });
    await User.create({
        id: USER_ID,
        fullName: 'Upload Tester',
        phone: '+962790000001',
        countryCode: 'JO',
        role: 'passenger',
        passwordHash: 'hashed',
        isVerified: true,
    });
    userToken = generateAccessToken({ id: USER_ID, role: 'passenger' });
    if (!fs.existsSync(TMP_UPLOAD_DIR)) {
        fs.mkdirSync(TMP_UPLOAD_DIR, { recursive: true });
    }
});
afterAll(() => {
    fs.rmSync(TMP_UPLOAD_DIR, { recursive: true, force: true });
});
describe('POST /api/upload', () => {
    it('should upload a valid PNG and return its url', async () => {
        const res = await getAgent()
            .post('/api/upload')
            .set('Authorization', `Bearer ${userToken}`)
            .attach('file', pngBuffer(), { filename: 'photo.png', contentType: 'image/png' });
        expect(res.status).toBe(200);
        expect(res.body.url).toMatch(/\/uploads\/.*\.png$/);
        expect(res.body.filename).toBeTruthy();
        expect(res.body.cached).toBe(false);
        const saved = await UploadedImage.findOne({ where: { filename: res.body.filename } });
        expect(saved).not.toBeNull();
        const fileRes = await getAgent().get(res.body.url);
        expect(fileRes.status).toBe(200);
        expect(fileRes.headers['content-type']).toContain('image/png');
    });
    it('should reject a non-image file with 400 INVALID_FILE_TYPE', async () => {
        const res = await getAgent()
            .post('/api/upload')
            .set('Authorization', `Bearer ${userToken}`)
            .attach('file', Buffer.from('plain text'), { filename: 'notes.txt', contentType: 'text/plain' });
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
            status: 'error',
            code: 'INVALID_FILE_TYPE',
        });
        expect(res.body.message).toMatch(/Only JPEG, PNG, WebP, and GIF/);
    });
    it('should reject files larger than 10MB with 413 FILE_TOO_LARGE', async () => {
        const big = Buffer.alloc(10 * 1024 * 1024 + 1, 1);
        const res = await getAgent()
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
        const res = await getAgent()
            .post('/api/upload')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.status).toBe(400);
        expect(res.body.code).toBe('BAD_REQUEST');
    });
    it('should require authentication', async () => {
        const res = await getAgent()
            .post('/api/upload')
            .attach('file', pngBuffer(), { filename: 'photo.png', contentType: 'image/png' });
        expect(res.status).toBe(401);
    });
});
//# sourceMappingURL=upload.test.js.map