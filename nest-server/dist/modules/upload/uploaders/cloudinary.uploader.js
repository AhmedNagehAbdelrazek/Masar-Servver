import { v2 as cloudinary } from 'cloudinary';
export class CloudinaryUploader {
    folder;
    constructor() {
        this.folder = process.env.CLOUDINARY_FOLDER ?? 'masar';
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }
    async upload(buffer, opts = {}) {
        const dataUri = `data:${opts.mimetype};base64,${Buffer.from(buffer).toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: this.folder,
            resource_type: 'image',
        });
        return { url: result.secure_url, filename: result.public_id };
    }
    async delete(filename) {
        await cloudinary.uploader.destroy(filename);
    }
}
//# sourceMappingURL=cloudinary.uploader.js.map