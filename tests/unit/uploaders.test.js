const path = require('path');
const fs = require('fs');

jest.mock('../../config/cloudinary', () => ({
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/v1/test.png',
      public_id: 'test/hash',
    }),
    destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
  },
}));

const { getUploader, resetUploader } = require('../../Services/uploaders');
const cloudinary = require('../../config/cloudinary');

afterEach(() => {
  resetUploader();
  jest.clearAllMocks();
});

describe('getUploader factory', () => {
  it('should return CloudinaryUploader by default', () => {
    process.env.UPLOAD_PROVIDER = 'cloudinary';
    const uploader = getUploader();
    expect(uploader.constructor.name).toBe('CloudinaryUploader');
  });

  it('should return LocalUploader when UPLOAD_PROVIDER=local', () => {
    process.env.UPLOAD_PROVIDER = 'local';
    const uploader = getUploader();
    expect(uploader.constructor.name).toBe('LocalUploader');
  });

  it('should throw for unknown provider', () => {
    process.env.UPLOAD_PROVIDER = 'unknown';
    expect(() => getUploader()).toThrow('Unknown upload provider "unknown"');
  });

  it('should return the same instance on repeated calls', () => {
    process.env.UPLOAD_PROVIDER = 'local';
    const a = getUploader();
    const b = getUploader();
    expect(a).toBe(b);
  });
});

describe('LocalUploader', () => {
  let uploader;
  const testDir = path.join(__dirname, '..', '__tmp_uploads__');

  beforeAll(() => {
    process.env.UPLOAD_PROVIDER = 'local';
    process.env.LOCAL_UPLOAD_DIR = testDir;
    process.env.LOCAL_UPLOAD_BASE_URL = '/uploads';
    resetUploader();
    uploader = getUploader();
  });

  afterAll(async () => {
    resetUploader();
    if (fs.existsSync(testDir)) {
      const files = await fs.promises.readdir(testDir);
      for (const f of files) await fs.promises.unlink(path.join(testDir, f));
      await fs.promises.rmdir(testDir);
    }
  });

  it('should upload a file and return url + filename', async () => {
    const buffer = Buffer.from('fake image data');
    const result = await uploader.upload(buffer, {
      mimetype: 'image/png',
      originalname: 'test.png',
    });

    expect(result.url).toMatch(/\/uploads\/.*\.png$/);
    expect(result.filename).toMatch(/\.png$/);

    const filePath = path.join(testDir, result.filename);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should delete a file', async () => {
    const buffer = Buffer.from('to be deleted');
    const { filename } = await uploader.upload(buffer, {
      mimetype: 'image/jpeg',
      originalname: 'delete-me.jpg',
    });

    const filePath = path.join(testDir, filename);
    expect(fs.existsSync(filePath)).toBe(true);

    await uploader.delete(filename);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('should not throw when deleting non-existent file', async () => {
    await expect(uploader.delete('nonexistent.jpg')).resolves.toBeUndefined();
  });
});

describe('CloudinaryUploader', () => {
  let uploader;

  beforeAll(() => {
    process.env.UPLOAD_PROVIDER = 'cloudinary';
    resetUploader();
    uploader = getUploader();
  });

  it('should upload via cloudinary SDK', async () => {
    const buffer = Buffer.from('fake image data');
    const result = await uploader.upload(buffer, { mimetype: 'image/png' });

    expect(result.url).toBe('https://res.cloudinary.com/test/image/upload/v1/test.png');
    expect(result.filename).toBe('test/hash');
    expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(1);
  });

  it('should delete via cloudinary SDK', async () => {
    await uploader.delete('test/hash');
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test/hash');
  });
});
