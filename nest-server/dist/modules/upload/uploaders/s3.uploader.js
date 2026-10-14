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
export class S3Uploader {
    bucket;
    region;
    baseUrl;
    clientInstance;
    constructor() {
        assertS3Configured();
        const bucket = process.env.S3_BUCKET;
        const region = process.env.S3_REGION;
        this.bucket = bucket;
        this.region = region;
        this.baseUrl = process.env.S3_BASE_URL ?? '';
    }
    client() {
        this.clientInstance ??= new S3Client({
            region: this.region,
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
            },
        });
        return this.clientInstance;
    }
    async upload(buffer, opts = {}) {
        const ext = extname(opts.originalname ?? '') || '';
        const key = `uploads/${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
        await this.client().send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: opts.mimetype }));
        const url = this.baseUrl
            ? `${this.baseUrl}/${key}`
            : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
        return { url, filename: key };
    }
    async delete(filename) {
        await this.client().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: filename }));
    }
}
//# sourceMappingURL=s3.uploader.js.map