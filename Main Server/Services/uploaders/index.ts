// @ts-nocheck
import CloudinaryUploader from './cloudinary';
import LocalUploader from './local';
import S3Uploader from './s3';

const providers = {
  cloudinary: CloudinaryUploader,
  local: LocalUploader,
  s3: S3Uploader,
};

let instance = null;

function getUploader(provider) {
  if (instance) return instance;

  // const provider = (process.env.UPLOAD_PROVIDER || 'cloudinary').toLowerCase();
  const Provider = providers[provider];

  if (!Provider) {
    throw new Error(
      `Unknown upload provider "${provider}". Available: ${Object.keys(providers).join(', ')}`
    );
  }

  instance = new Provider();
  return instance;
}

function resetUploader() {
  instance = null;
}

module.exports = { getUploader, resetUploader };
export { getUploader, resetUploader };
export default module.exports;