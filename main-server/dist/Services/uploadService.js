"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = upload;
exports.remove = remove;
// @ts-nocheck
const ApiError_1 = require("../utils/ApiError");
const crypto_1 = __importDefault(require("crypto"));
const uploaders_1 = require("./uploaders");
const UploadedImage_1 = __importDefault(require("../Models/UploadedImage"));
async function upload(req) {
    if (!req.file) {
        throw ApiError_1.ApiErrors.badRequest('NO_FILE_UPLOADED');
    }
    const hash = crypto_1.default.createHash('sha256').update(req.file.buffer).digest('hex');
    const existing = await UploadedImage_1.default.findOne({ where: { hash } });
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
    const uploader = (0, uploaders_1.getUploader)(provider);
    const { url, filename } = await uploader.upload(req.file.buffer, {
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
    });
    const image = await UploadedImage_1.default.create({
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
    const image = await UploadedImage_1.default.findByPk(imageId);
    if (!image)
        return;
    const uploader = (0, uploaders_1.getUploader)();
    await uploader.delete(image.filename);
    await image.destroy();
}
module.exports = { upload, remove };
exports.default = module.exports;
//# sourceMappingURL=uploadService.js.map