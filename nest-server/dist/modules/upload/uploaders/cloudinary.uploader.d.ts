import type { Uploader, UploadOptions } from './uploader.interface.js';
export declare class CloudinaryUploader implements Uploader {
    private readonly folder;
    constructor();
    upload(buffer: Buffer, opts?: UploadOptions): Promise<{
        url: string;
        filename: string;
    }>;
    delete(filename: string): Promise<void>;
}
