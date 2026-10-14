import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, promises as fs } from 'node:fs';
import { extname, join, resolve } from 'node:path';
export class LocalUploader {
    uploadDir;
    baseUrl;
    constructor() {
        this.uploadDir = resolve(process.env.LOCAL_UPLOAD_DIR ?? join(process.cwd(), 'uploads'));
        this.baseUrl = process.env.LOCAL_UPLOAD_BASE_URL ?? '/uploads';
        if (!existsSync(this.uploadDir))
            mkdirSync(this.uploadDir, { recursive: true });
    }
    extFromMime(mimetype) {
        const map = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'image/gif': '.gif',
        };
        return (mimetype && map[mimetype]) || '.bin';
    }
    async upload(buffer, opts = {}) {
        const ext = extname(opts.originalname ?? '') || this.extFromMime(opts.mimetype);
        const name = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
        await fs.writeFile(join(this.uploadDir, name), buffer);
        return { url: `${this.baseUrl}/${name}`, filename: name };
    }
    async delete(filename) {
        try {
            await fs.unlink(join(this.uploadDir, filename));
        }
        catch (err) {
            if (err.code !== 'ENOENT')
                throw err;
        }
    }
}
//# sourceMappingURL=local.uploader.js.map