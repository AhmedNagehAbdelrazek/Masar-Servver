import { OnModuleInit } from '@nestjs/common';
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
export declare class UploadService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): void;
    private providerName;
    private assertProviderConfigured;
    private uploader;
    upload(file: StoredFile | undefined): Promise<UploadResult>;
    remove(imageId: number): Promise<void>;
}
