export interface UploadOptions {
    mimetype?: string;
    originalname?: string;
}
export interface Uploader {
    upload(buffer: Buffer, opts?: UploadOptions): Promise<{
        url: string;
        filename: string;
    }>;
    delete(filename: string): Promise<void>;
}
