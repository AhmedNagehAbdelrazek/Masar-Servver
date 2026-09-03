// @ts-nocheck
import cloudinary from '../../config/cloudinary';

class CloudinaryUploader {
  constructor() {
    this.folder = process.env.CLOUDINARY_FOLDER || 'masar';
  }

  async upload(buffer, { mimetype } = {}) {
    const b64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: this.folder,
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      filename: result.public_id,
    };
  }

  async delete(filename) {
    await cloudinary.uploader.destroy(filename);
  }
}

module.exports = CloudinaryUploader;
export default CloudinaryUploader;