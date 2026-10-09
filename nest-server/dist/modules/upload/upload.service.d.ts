import { PrismaService } from '../../prisma/prisma.service.js';
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
export declare class UploadService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private uploader;
    upload(file: StoredFile | undefined): Promise<UploadResult>;
    remove(imageId: number): Promise<void>;
}
