// @ts-nocheck
import path from 'path';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

function parseBoolean(value) {
  if (value === undefined || String(value).trim() === '') return undefined;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return undefined;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return raw.replace(/\/+$/, '');
  // Coolify/Garage hosts are frequently pasted without a scheme.
  return `https://${raw.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

class S3Uploader {
  constructor() {
    this.bucket = process.env.S3_BUCKET;
    this.region = process.env.S3_REGION;
    this.endpoint = normalizeUrl(process.env.S3_ENDPOINT);
    this.accessKeyId = process.env.S3_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.baseUrl = normalizeUrl(process.env.S3_PUBLIC_URL || process.env.S3_BASE_URL) || '';
    // S3-compatible stores (Garage, MinIO, ...) normally require path-style
    // URLs. Default to path-style whenever a custom endpoint is configured.
    this.forcePathStyle =
      parseBoolean(process.env.S3_FORCE_PATH_STYLE) ?? this.endpoint !== undefined;

    if (!this.bucket || !this.region) {
      throw new Error('S3_BUCKET and S3_REGION environment variables are required');
    }
    if (this.endpoint && !this.baseUrl) {
      console.warn(
        '[s3] S3_BASE_URL is not set; stored image URLs will use S3_ENDPOINT, which may require signed requests and return 403 to browsers.'
      );
    }
  }

  async _getClient() {
    if (this._client) return this._client;

    try {

      this._client = new S3Client({
        region: this.region,
        endpoint: this.endpoint,
        forcePathStyle: this.forcePathStyle,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
      this._PutObjectCommand = PutObjectCommand;
      this._DeleteObjectCommand = DeleteObjectCommand;
    } catch {
      throw new Error('Install @aws-sdk/client-s3 to use the S3 uploader: npm install @aws-sdk/client-s3');
    }

    return this._client;
  }

  _publicUrl(key) {
    const baseUrl = this.baseUrl.replace(/\/+$/, '');
    if (baseUrl) return `${baseUrl}/${key}`;
    if (this.endpoint) {
      return `${this.endpoint.replace(/\/+$/, '')}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async upload(buffer, { mimetype, originalname } = {}) {
    const ext = path.extname(originalname || '') || '';
    const key = `uploads/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

    const client = await this._getClient();
    await client.send(new this._PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    }));

    return { url: this._publicUrl(key), filename: key };
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
export default S3Uploader;