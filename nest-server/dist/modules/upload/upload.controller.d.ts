import { UploadService } from './upload.service.js';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    upload(file: Express.Multer.File | undefined): Promise<unknown>;
}
