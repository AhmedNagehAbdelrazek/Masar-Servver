import type { Uploader, UploadOptions } from './uploader.interface.js';
export declare class LocalUploader implements Uploader {
    private readonly uploadDir;
    private readonly baseUrl;
    constructor();
    private extFromMime;
    upload(buffer: Buffer, opts?: UploadOptions): Promise<{
        url: string;
        filename: string;
    }>;
    delete(filename: string): Promise<void>;
}
