import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CloudinaryUploader } from './uploaders/cloudinary.uploader.js';
import { LocalUploader } from './uploaders/local.uploader.js';
import { S3Uploader } from './uploaders/s3.uploader.js';
import type { Uploader } from './uploaders/uploader.interface.js';

export interface StoredFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export interface UploadResult {
  id: number;
  url: string;
  filename: string;
  cached: boolean;
  provider: string | null;
}

// Port of Main Server/Services/uploadService.ts: sha256 dedup via
// UploadedImage.hash, provider dispatch via UPLOAD_PROVIDER.
@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  private uploader(): { uploader: Uploader; provider: string } {
    const provider = (process.env.UPLOAD_PROVIDER ?? 'cloudinary').toLowerCase();
    if (provider === 'local') return { uploader: new LocalUploader(), provider };
    if (provider === 's3') return { uploader: new S3Uploader(), provider };
    if (provider === 'cloudinary') return { uploader: new CloudinaryUploader(), provider };
    throw new Error(
      `Unknown upload provider "${provider}". Available: cloudinary, local, s3`,
    );
  }

  async upload(file: StoredFile | undefined): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException({ message: 'No file uploaded', code: 'BAD_REQUEST' });
    }
    const hash = createHash('sha256').update(file.buffer).digest('hex');
    const existing = await this.prisma.uploadedImage.findUnique({ where: { hash } });
    if (existing) {
      return {
        id: existing.id,
        url: existing.url,
        filename: existing.filename,
        cached: true,
        provider: existing.provider,
      };
    }
    const { uploader, provider } = this.uploader();
    const { url, filename } = await uploader.upload(file.buffer, {
      mimetype: file.mimetype,
      originalname: file.originalname,
    });
    const image = await this.prisma.uploadedImage.create({
      data: {
        hash,
        url,
        filename,
        mimetype: file.mimetype,
        size: file.size,
        provider,
      },
    });
    return { id: image.id, url, filename, cached: false, provider: image.provider };
  }

  async remove(imageId: number): Promise<void> {
    const image = await this.prisma.uploadedImage.findUnique({ where: { id: imageId } });
    if (!image) return;
    const { uploader } = this.uploader();
    await uploader.delete(image.filename);
    await this.prisma.uploadedImage.delete({ where: { id: imageId } });
  }
}
