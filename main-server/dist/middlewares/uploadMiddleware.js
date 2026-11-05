"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const ApiError_1 = require("../utils/ApiError");
const storage = multer_1.default.memoryStorage();
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const fileFilter = (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(ApiError_1.ApiErrors.custom('ONLY_JPEG_PNG_WEBP_AND_GIF_IMAGES_ARE_ALLOWED', 400, 'INVALID_FILE_TYPE'));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});
exports.default = upload;
module.exports = upload;
//# sourceMappingURL=uploadMiddleware.js.map