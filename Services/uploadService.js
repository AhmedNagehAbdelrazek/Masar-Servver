const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');
const UploadedImage = require('../Models/UploadedImage');

async function upload(req) {
  if (!req.file) {
    throw require('../utils/ApiError').ApiErrors.badRequest('No file uploaded');
  }

  const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

  const existing = await UploadedImage.findOne({ where: { hash } });
  if (existing) {
    return { url: existing.url, filename: existing.filename, cached: true };
  }

  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const dataUri = `data:${req.file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'techa',
    resource_type: 'image',
  });

  await UploadedImage.create({
    hash,
    url: result.secure_url,
    filename: result.public_id,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });

  return { url: result.secure_url, filename: result.public_id, cached: false };
}

module.exports = { upload };
