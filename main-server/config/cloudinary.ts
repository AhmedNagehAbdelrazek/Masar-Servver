import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
export { cloudinary };

// CommonJS compatibility: `require('./config/cloudinary')` should return the cloudinary instance
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = cloudinary;
  // @ts-ignore
  module.exports.default = cloudinary;
}
