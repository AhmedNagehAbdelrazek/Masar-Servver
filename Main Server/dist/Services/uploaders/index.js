"use strict";
const CloudinaryUploader = require('./cloudinary');
const LocalUploader = require('./local');
const S3Uploader = require('./s3');
const providers = {
    cloudinary: CloudinaryUploader,
    local: LocalUploader,
    s3: S3Uploader,
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
//# sourceMappingURL=index.js.map