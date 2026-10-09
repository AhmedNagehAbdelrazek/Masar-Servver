import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, promises as fs } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import type { Uploader, UploadOptions } from './uploader.interface.js';

// Port of Main Server/Services/uploaders/local.ts
export class LocalUploader implements Uploader {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.uploadDir = resolve(process.env.LOCAL_UPLOAD_DIR ?? join(process.cwd(), 'uploads'));
    this.baseUrl = process.env.LOCAL_UPLOAD_BASE_URL ?? '/uploads';
    if (!existsSync(this.uploadDir)) mkdirSync(this.uploadDir, { recursive: true });
  }

  private extFromMime(mimetype?: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    return (mimetype && map[mimetype]) || '.bin';
  }

  async upload(buffer: Buffer, opts: UploadOptions = {}): Promise<{ url: string; filename: string }> {
    const ext = extname(opts.originalname ?? '') || this.extFromMime(opts.mimetype);
    const name = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
    await fs.writeFile(join(this.uploadDir, name), buffer);
    return { url: `${this.baseUrl}/${name}`, filename: name };
  }

  async delete(filename: string): Promise<void> {
    try {
      await fs.unlink(join(this.uploadDir, filename));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }
}
