import {
  BadRequestException,
  Controller,
  HttpCode,
  PayloadTooLargeException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService, type StoredFile } from './upload.service.js';

// Express parity: Routes/uploadRoutes.ts POST /api/upload (protect).
// Validation mirrors middlewares/uploadMiddleware.ts (memory storage,
// 10MB limit, jpeg/png/webp/gif only) with identical error envelopes.
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(@UploadedFile() file: Express.Multer.File | undefined): Promise<unknown> {
    if (!file) {
      throw new BadRequestException({ message: 'No file uploaded', code: 'BAD_REQUEST' });
    }
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException({
        message: 'Only JPEG, PNG, WebP, and GIF images are allowed.',
        code: 'INVALID_FILE_TYPE',
      });
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException({
        message: 'File too large. Maximum allowed size is 10 MB.',
        code: 'FILE_TOO_LARGE',
      });
    }
    const stored: StoredFile = {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    };
    return this.uploadService.upload(stored);
  }
}
