"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
class LocalUploader {
    constructor() {
        this.uploadDir = path_1.default.resolve(process.env.LOCAL_UPLOAD_DIR || path_1.default.join(__dirname, '..', '..', 'uploads'));
        this.baseUrl = process.env.LOCAL_UPLOAD_BASE_URL || '/uploads';
        if (!fs_1.default.existsSync(this.uploadDir)) {
            fs_1.default.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
    async upload(buffer, { mimetype, originalname } = {}) {
        const ext = path_1.default.extname(originalname || '') || this._extFromMime(mimetype);
        const name = `${Date.now()}-${crypto_1.default.randomBytes(8).toString('hex')}${ext}`;
        const filePath = path_1.default.join(this.uploadDir, name);
        await fs_1.default.promises.writeFile(filePath, buffer);
        return {
            url: `${this.baseUrl}/${name}`,
            filename: name,
        };
    }
    async delete(filename) {
        const filePath = path_1.default.join(this.uploadDir, filename);
        try {
            await fs_1.default.promises.unlink(filePath);
        }
        catch (err) {
            if (err.code !== 'ENOENT')
                throw err;
        }
    }
    _extFromMime(mimetype) {
        const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
        return map[mimetype] || '.bin';
    }
}
module.exports = LocalUploader;
exports.default = LocalUploader;
//# sourceMappingURL=local.js.map