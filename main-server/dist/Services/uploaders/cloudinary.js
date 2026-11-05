"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const cloudinary_1 = __importDefault(require("../../config/cloudinary"));
class CloudinaryUploader {
    constructor() {
        this.folder = process.env.CLOUDINARY_FOLDER || 'masar';
    }
    async upload(buffer, { mimetype } = {}) {
        const b64 = Buffer.from(buffer).toString('base64');
        const dataUri = `data:${mimetype};base64,${b64}`;
        const result = await cloudinary_1.default.uploader.upload(dataUri, {
            folder: this.folder,
            resource_type: 'image',
        });
        return {
            url: result.secure_url,
            filename: result.public_id,
        };
    }
    async delete(filename) {
        await cloudinary_1.default.uploader.destroy(filename);
    }
}
module.exports = CloudinaryUploader;
exports.default = CloudinaryUploader;
//# sourceMappingURL=cloudinary.js.map