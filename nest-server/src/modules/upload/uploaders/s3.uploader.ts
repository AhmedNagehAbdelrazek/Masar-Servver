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

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function normalizeUrl(value: string | undefined): string | undefined {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return raw.replace(/\/+$/, '');
  // Coolify/Garage hosts are frequently pasted without a scheme.
  return `https://${raw.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

// Port of main-server/Services/uploaders/s3.ts
export class S3Uploader implements Uploader {
  private readonly bucket: string;
  private readonly region: string;
  private readonly endpoint?: string;
  private readonly baseUrl: string;
  private readonly forcePathStyle: boolean;
  private clientInstance?: S3Client;

  constructor() {
    assertS3Configured();
    const bucket = process.env.S3_BUCKET as string;
    const region = process.env.S3_REGION as string;
    this.bucket = bucket;
    this.region = region;
    this.endpoint = normalizeUrl(process.env.S3_ENDPOINT);
    this.baseUrl = normalizeUrl(process.env.S3_PUBLIC_URL || process.env.S3_BASE_URL) ?? '';
    // S3-compatible stores (Garage, MinIO, ...) normally require path-style
    // URLs. Default to path-style whenever a custom endpoint is configured.
    this.forcePathStyle =
      parseBoolean(process.env.S3_FORCE_PATH_STYLE) ?? this.endpoint !== undefined;
    if (this.endpoint && !this.baseUrl) {
      new Logger(S3Uploader.name).warn(
        'S3_BASE_URL is not set; stored image URLs will use S3_ENDPOINT, which may require signed requests and return 403 to browsers.',
      );
    }
  }

  private client(): S3Client {
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

  private publicUrl(key: string): string {
    const baseUrl = this.baseUrl.replace(/\/+$/, '');
    if (baseUrl) return `${baseUrl}/${key}`;
    if (this.endpoint) {
      return `${this.endpoint.replace(/\/+$/, '')}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async upload(buffer: Buffer, opts: UploadOptions = {}): Promise<{ url: string; filename: string }> {
    const ext = extname(opts.originalname ?? '') || '';
    const key = `uploads/${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
    await this.client().send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: opts.mimetype }),
    );
    return { url: this.publicUrl(key), filename: key };
  }

  async delete(filename: string): Promise<void> {
    await this.client().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: filename }));
  }
}
