var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadService_1;
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CloudinaryUploader } from './uploaders/cloudinary.uploader.js';
import { LocalUploader } from './uploaders/local.uploader.js';
import { assertS3Configured, S3Uploader } from './uploaders/s3.uploader.js';
let UploadService = UploadService_1 = class UploadService {
    prisma;
    logger = new Logger(UploadService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    onModuleInit() {
        this.assertProviderConfigured();
    }
    providerName() {
        return (process.env.UPLOAD_PROVIDER ?? 'cloudinary').toLowerCase();
    }
    assertProviderConfigured() {
        const provider = this.providerName();
        if (provider === 's3') {
            assertS3Configured(this.logger);
            return;
        }
        if (provider !== 'local' && provider !== 'cloudinary') {
            this.logger.error(`Unknown upload provider "${provider}". Available: cloudinary, local, s3`);
            throw new Error(`Unknown upload provider "${provider}". Available: cloudinary, local, s3`);
        }
    }
    uploader() {
        this.assertProviderConfigured();
        const provider = this.providerName();
        if (provider === 'local')
            return { uploader: new LocalUploader(), provider };
        if (provider === 's3')
            return { uploader: new S3Uploader(), provider };
        return { uploader: new CloudinaryUploader(), provider };
    }
    async upload(file) {
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
    async remove(imageId) {
        const image = await this.prisma.uploadedImage.findUnique({ where: { id: imageId } });
        if (!image)
            return;
        const { uploader } = this.uploader();
        await uploader.delete(image.filename);
        await this.prisma.uploadedImage.delete({ where: { id: imageId } });
    }
};
UploadService = UploadService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], UploadService);
export { UploadService };
//# sourceMappingURL=upload.service.js.map