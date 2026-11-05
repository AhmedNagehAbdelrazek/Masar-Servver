"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
globals_1.jest.mock('../../config/cloudinary', () => ({
    uploader: {
        upload: globals_1.jest.fn().mockResolvedValue({
            secure_url: 'https://res.cloudinary.com/test/image/upload/v1/test.png',
            public_id: 'test/hash',
        }),
        destroy: globals_1.jest.fn().mockResolvedValue({ result: 'ok' }),
    },
}));
const { getUploader, resetUploader } = require('../../Services/uploaders');
const cloudinary = require('../../config/cloudinary');
(0, globals_1.afterEach)(() => {
    resetUploader();
    globals_1.jest.clearAllMocks();
});
(0, globals_1.describe)('getUploader factory', () => {
    (0, globals_1.it)('should return CloudinaryUploader by default', () => {
        process.env.UPLOAD_PROVIDER = 'cloudinary';
        const uploader = getUploader();
        (0, globals_1.expect)(uploader.constructor.name).toBe('CloudinaryUploader');
    });
    (0, globals_1.it)('should return LocalUploader when UPLOAD_PROVIDER=local', () => {
        process.env.UPLOAD_PROVIDER = 'local';
        const uploader = getUploader();
        (0, globals_1.expect)(uploader.constructor.name).toBe('LocalUploader');
    });
    (0, globals_1.it)('should throw for unknown provider', () => {
        process.env.UPLOAD_PROVIDER = 'unknown';
        (0, globals_1.expect)(() => getUploader()).toThrow('Unknown upload provider "unknown"');
    });
    (0, globals_1.it)('should return the same instance on repeated calls', () => {
        process.env.UPLOAD_PROVIDER = 'local';
        const a = getUploader();
        const b = getUploader();
        (0, globals_1.expect)(a).toBe(b);
    });
});
(0, globals_1.describe)('LocalUploader', () => {
    let uploader;
    const testDir = path_1.default.join(__dirname, '..', '__tmp_uploads__');
    (0, globals_1.beforeAll)(() => {
        process.env.UPLOAD_PROVIDER = 'local';
        process.env.LOCAL_UPLOAD_DIR = testDir;
        process.env.LOCAL_UPLOAD_BASE_URL = '/uploads';
        resetUploader();
        uploader = getUploader();
    });
    (0, globals_1.afterAll)(async () => {
        resetUploader();
        if (fs_1.default.existsSync(testDir)) {
            const files = await fs_1.default.promises.readdir(testDir);
            for (const f of files)
                await fs_1.default.promises.unlink(path_1.default.join(testDir, f));
            await fs_1.default.promises.rmdir(testDir);
        }
    });
    (0, globals_1.it)('should upload a file and return url + filename', async () => {
        const buffer = Buffer.from('fake image data');
        const result = await uploader.upload(buffer, {
            mimetype: 'image/png',
            originalname: 'test.png',
        });
        (0, globals_1.expect)(result.url).toMatch(/\/uploads\/.*\.png$/);
        (0, globals_1.expect)(result.filename).toMatch(/\.png$/);
        const filePath = path_1.default.join(testDir, result.filename);
        (0, globals_1.expect)(fs_1.default.existsSync(filePath)).toBe(true);
    });
    (0, globals_1.it)('should delete a file', async () => {
        const buffer = Buffer.from('to be deleted');
        const { filename } = await uploader.upload(buffer, {
            mimetype: 'image/jpeg',
            originalname: 'delete-me.jpg',
        });
        const filePath = path_1.default.join(testDir, filename);
        (0, globals_1.expect)(fs_1.default.existsSync(filePath)).toBe(true);
        await uploader.delete(filename);
        (0, globals_1.expect)(fs_1.default.existsSync(filePath)).toBe(false);
    });
    (0, globals_1.it)('should not throw when deleting non-existent file', async () => {
        await (0, globals_1.expect)(uploader.delete('nonexistent.jpg')).resolves.toBeUndefined();
    });
});
(0, globals_1.describe)('CloudinaryUploader', () => {
    let uploader;
    (0, globals_1.beforeAll)(() => {
        process.env.UPLOAD_PROVIDER = 'cloudinary';
        resetUploader();
        uploader = getUploader();
    });
    (0, globals_1.it)('should upload via cloudinary SDK', async () => {
        const buffer = Buffer.from('fake image data');
        const result = await uploader.upload(buffer, { mimetype: 'image/png' });
        (0, globals_1.expect)(result.url).toBe('https://res.cloudinary.com/test/image/upload/v1/test.png');
        (0, globals_1.expect)(result.filename).toBe('test/hash');
        (0, globals_1.expect)(cloudinary.uploader.upload).toHaveBeenCalledTimes(1);
    });
    (0, globals_1.it)('should delete via cloudinary SDK', async () => {
        await uploader.delete('test/hash');
        (0, globals_1.expect)(cloudinary.uploader.destroy).toHaveBeenCalledWith('test/hash');
    });
});
//# sourceMappingURL=uploaders.test.js.map