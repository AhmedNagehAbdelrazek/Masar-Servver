"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const client_s3_1 = require("@aws-sdk/client-s3");
class S3Uploader {
    constructor() {
        this.bucket = process.env.S3_BUCKET;
        this.region = process.env.S3_REGION;
        this.accessKeyId = process.env.S3_ACCESS_KEY_ID;
        this.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
        this.baseUrl = process.env.S3_BASE_URL || '';
        if (!this.bucket || !this.region) {
            throw new Error('S3_BUCKET and S3_REGION environment variables are required');
        }
    }
    async _getClient() {
        if (this._client)
            return this._client;
        try {
            this._client = new client_s3_1.S3Client({
                region: this.region,
                credentials: {
                    accessKeyId: this.accessKeyId,
                    secretAccessKey: this.secretAccessKey,
                },
            });
            this._PutObjectCommand = client_s3_1.PutObjectCommand;
            this._DeleteObjectCommand = client_s3_1.DeleteObjectCommand;
        }
        catch {
            throw new Error('Install @aws-sdk/client-s3 to use the S3 uploader: npm install @aws-sdk/client-s3');
        }
        return this._client;
    }
    async upload(buffer, { mimetype, originalname } = {}) {
        const ext = path_1.default.extname(originalname || '') || '';
        const key = `uploads/${Date.now()}-${crypto_1.default.randomBytes(8).toString('hex')}${ext}`;
        const client = await this._getClient();
        await client.send(new this._PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: mimetype,
        }));
        const url = this.baseUrl
            ? `${this.baseUrl}/${key}`
            : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
        return { url, filename: key };
    }
    async delete(filename) {
        const client = await this._getClient();
        await client.send(new this._DeleteObjectCommand({
            Bucket: this.bucket,
            Key: filename,
        }));
    }
}
module.exports = S3Uploader;
exports.default = S3Uploader;
//# sourceMappingURL=s3.js.map