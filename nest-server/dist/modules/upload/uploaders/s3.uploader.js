import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { extname } from 'node:path';
export function assertS3Configured(logger = new Logger(S3Uploader.name)) {
    if (!process.env.S3_BUCKET || !process.env.S3_REGION) {
        logger.error('S3 uploader misconfigured: S3_BUCKET and S3_REGION environment variables are required');
        throw new Error('S3_BUCKET and S3_REGION environment variables are required');
    }
}
function parseBoolean(value) {
    if (value === undefined || value.trim() === '')
        return undefined;
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}
export class S3Uploader {
    bucket;
    region;
    endpoint;
    baseUrl;
    forcePathStyle;
    clientInstance;
    constructor() {
        assertS3Configured();
        const bucket = process.env.S3_BUCKET;
        const region = process.env.S3_REGION;
        this.bucket = bucket;
        this.region = region;
        this.endpoint = process.env.S3_ENDPOINT?.trim() || undefined;
        this.baseUrl = process.env.S3_BASE_URL ?? '';
        this.forcePathStyle =
            parseBoolean(process.env.S3_FORCE_PATH_STYLE) ?? this.endpoint !== undefined;
    }
    client() {
        this.clientInstance ??= new S3Client({
            region: this.region,
            endpoint: this.endpoint,
            forcePathStyle: this.forcePathStyle,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
            },
        });
        return this.clientInstance;
    }
    publicUrl(key) {
        const baseUrl = this.baseUrl.replace(/\/+$/, '');
        if (baseUrl)
            return `${baseUrl}/${key}`;
        if (this.endpoint) {
            return `${this.endpoint.replace(/\/+$/, '')}/${this.bucket}/${key}`;
        }
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }
    async upload(buffer, opts = {}) {
        const ext = extname(opts.originalname ?? '') || '';
        const key = `uploads/${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
        await this.client().send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: opts.mimetype }));
        return { url: this.publicUrl(key), filename: key };
    }
    async delete(filename) {
        await this.client().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: filename }));
    }
}
//# sourceMappingURL=s3.uploader.js.map