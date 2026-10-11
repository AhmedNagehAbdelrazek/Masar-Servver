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
// 10MB limit, jpeg/png/webp/gif only) with identical error envelopes:
// no file -> NO_FILE_UPLOADED/BAD_REQUEST (Services/uploadService.ts),
// bad type -> ONLY_JPEG_*_ARE_ALLOWED/INVALID_FILE_TYPE (fileFilter),
// oversize -> FILE_TOO_LARGE_10MB/FILE_TOO_LARGE (globalErrorHandler).
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
      throw new BadRequestException({ message: 'NO_FILE_UPLOADED', code: 'BAD_REQUEST' });
    }
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new BadRequestException({
        message: 'ONLY_JPEG_PNG_WEBP_AND_GIF_IMAGES_ARE_ALLOWED',
        code: 'INVALID_FILE_TYPE',
      });
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException({
        message: 'FILE_TOO_LARGE_10MB',
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
