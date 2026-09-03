// @ts-nocheck
import { ApiErrors } from '../utils/ApiError';
import crypto from 'crypto';
import { getUploader } from './uploaders';
import UploadedImage from '../Models/UploadedImage';

async function upload(req) {
  if (!req.file) {
    throw ApiErrors.badRequest('NO_FILE_UPLOADED');
  }

  const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

  const existing = await UploadedImage.findOne({ where: { hash } });
  if (existing) {
    return {
      id: existing.id,
      url: existing.url,
      filename: existing.filename,
      cached: true,
      provider: existing?.provider
    };
  }
  const provider = (process.env.UPLOAD_PROVIDER || 'cloudinary').toLowerCase();
  const uploader = getUploader(provider);
  const { url, filename } = await uploader.upload(req.file.buffer, {
    mimetype: req.file.mimetype,
    originalname: req.file.originalname,
  });

  const image = await UploadedImage.create({
    hash,
    url,
    filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
    provider
  });

  return { id: image.id, url, filename, cached: false, provider: image?.provider };
}

async function remove(imageId) {
  const image = await UploadedImage.findByPk(imageId);
  if (!image) return;

  const uploader = getUploader();
  await uploader.delete(image.filename);
  await image.destroy();
}

module.exports = { upload, remove };
export { upload, remove };
export default module.exports;