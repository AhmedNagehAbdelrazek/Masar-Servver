"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploader = getUploader;
exports.resetUploader = resetUploader;
// @ts-nocheck
const cloudinary_1 = __importDefault(require("./cloudinary"));
const local_1 = __importDefault(require("./local"));
const s3_1 = __importDefault(require("./s3"));
const providers = {
    cloudinary: cloudinary_1.default,
    local: local_1.default,
    s3: s3_1.default,
};
let instance = null;
function getUploader(provider) {
    if (instance)
        return instance;
    // const provider = (process.env.UPLOAD_PROVIDER || 'cloudinary').toLowerCase();
    const Provider = providers[provider];
    if (!Provider) {
        throw new Error(`Unknown upload provider "${provider}". Available: ${Object.keys(providers).join(', ')}`);
    }
    instance = new Provider();
    return instance;
}
function resetUploader() {
    instance = null;
}
module.exports = { getUploader, resetUploader };
exports.default = module.exports;
//# sourceMappingURL=index.js.map