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

  function duplicateResult(existing) {
    return {
      id: existing.id,
      url: existing.url,
      filename: existing.filename,
      cached: true,
      duplicate: true,
      message: 'DUPLICATE_IMAGE_ACCEPTED',
      provider: existing?.provider,
    };
  }

  const existing = await UploadedImage.findOne({ where: { hash } });
  if (existing) {
    return duplicateResult(existing);
  }
  const provider = (process.env.UPLOAD_PROVIDER || 'cloudinary').toLowerCase();
  const uploader = getUploader(provider);
  const { url, filename } = await uploader.upload(req.file.buffer, {
    mimetype: req.file.mimetype,
    originalname: req.file.originalname,
  });

  try {
    const image = await UploadedImage.create({
      hash,
      url,
      filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      provider
    });

    return { id: image.id, url, filename, cached: false, duplicate: false, provider: image?.provider };
  } catch (err) {
    // A concurrent upload can insert the same hash between the lookup above
    // and this create. Accept it and return the existing row as a duplicate.
    const code = err && err.parent && err.parent.code;
    if (code === '23505' || err?.name === 'SequelizeUniqueConstraintError') {
      const duplicate = await UploadedImage.findOne({ where: { hash } });
      if (duplicate) return duplicateResult(duplicate);
    }
    throw err;
  }
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