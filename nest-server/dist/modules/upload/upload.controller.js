var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BadRequestException, Controller, HttpCode, PayloadTooLargeException, Post, UploadedFile, UseInterceptors, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service.js';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
let UploadController = class UploadController {
    uploadService;
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    upload(file) {
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
        const stored = {
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
            size: file.size,
        };
        return this.uploadService.upload(stored);
    }
};
__decorate([
    Post(),
    HttpCode(200),
    UseInterceptors(FileInterceptor('file', { storage: memoryStorage() })),
    __param(0, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "upload", null);
UploadController = __decorate([
    Controller('upload'),
    __metadata("design:paramtypes", [UploadService])
], UploadController);
export { UploadController };
//# sourceMappingURL=upload.controller.js.map