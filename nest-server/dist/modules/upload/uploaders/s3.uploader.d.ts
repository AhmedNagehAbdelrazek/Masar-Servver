import type { Uploader, UploadOptions } from './uploader.interface.js';
export declare class S3Uploader implements Uploader {
    private readonly bucket;
    private readonly region;
    private readonly baseUrl;
    private clientInstance?;
    constructor();
    private client;
    upload(buffer: Buffer, opts?: UploadOptions): Promise<{
        url: string;
        filename: string;
    }>;
    delete(filename: string): Promise<void>;
}
