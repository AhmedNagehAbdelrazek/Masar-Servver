import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CloudinaryUploader } from './uploaders/cloudinary.uploader.js';
import { LocalUploader } from './uploaders/local.uploader.js';
import { assertS3Configured, S3Uploader } from './uploaders/s3.uploader.js';
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
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Bootstrap-time validation: unknown providers or missing S3 env crash
  // startup (with Logger context) instead of failing the first upload.
  onModuleInit(): void {
    this.assertProviderConfigured();
  }

  private providerName(): string {
    return (process.env.UPLOAD_PROVIDER ?? 'cloudinary').toLowerCase();
  }

  private assertProviderConfigured(): void {
    const provider = this.providerName();
    if (provider === 's3') {
      assertS3Configured(this.logger);
      return;
    }
    if (provider !== 'local' && provider !== 'cloudinary') {
      this.logger.error(
        `Unknown upload provider "${provider}". Available: cloudinary, local, s3`,
      );
      throw new Error(
        `Unknown upload provider "${provider}". Available: cloudinary, local, s3`,
      );
    }
  }

  private uploader(): { uploader: Uploader; provider: string } {
    // Validated at bootstrap (onModuleInit); re-asserted here so a config
    // change between init and first request still fails loud, not silent.
    this.assertProviderConfigured();
    const provider = this.providerName();
    if (provider === 'local') return { uploader: new LocalUploader(), provider };
    if (provider === 's3') return { uploader: new S3Uploader(), provider };
    return { uploader: new CloudinaryUploader(), provider };
  }

  async upload(file: StoredFile | undefined): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException({ message: 'NO_FILE_UPLOADED', code: 'BAD_REQUEST' });
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
