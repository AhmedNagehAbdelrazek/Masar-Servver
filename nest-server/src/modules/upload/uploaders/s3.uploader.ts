import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { extname } from 'node:path';
import type { Uploader, UploadOptions } from './uploader.interface.js';

// Fail-fast env check shared by the constructor (per-request safety net) and
// UploadService.onModuleInit (bootstrap-time validation, so misconfig crashes
// startup instead of the first upload). Logs with context before throwing.
export function assertS3Configured(logger: Logger = new Logger(S3Uploader.name)): void {
  if (!process.env.S3_BUCKET || !process.env.S3_REGION) {
    logger.error(
      'S3 uploader misconfigured: S3_BUCKET and S3_REGION environment variables are required',
    );
    throw new Error('S3_BUCKET and S3_REGION environment variables are required');
  }
}

// Port of Main Server/Services/uploaders/s3.ts
export class S3Uploader implements Uploader {
  private readonly bucket: string;
  private readonly region: string;
  private readonly baseUrl: string;
  private clientInstance?: S3Client;

  constructor() {
    assertS3Configured();
    const bucket = process.env.S3_BUCKET as string;
    const region = process.env.S3_REGION as string;
    this.bucket = bucket;
    this.region = region;
    this.baseUrl = process.env.S3_BASE_URL ?? '';
  }

  private client(): S3Client {
    this.clientInstance ??= new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      },
    });
    return this.clientInstance;
  }

  async upload(buffer: Buffer, opts: UploadOptions = {}): Promise<{ url: string; filename: string }> {
    const ext = extname(opts.originalname ?? '') || '';
    const key = `uploads/${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
    await this.client().send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: opts.mimetype }),
    );
    const url = this.baseUrl
      ? `${this.baseUrl}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    return { url, filename: key };
  }

  async delete(filename: string): Promise<void> {
    await this.client().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: filename }));
  }
}
