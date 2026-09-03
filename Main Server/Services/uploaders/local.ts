// @ts-nocheck
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

class LocalUploader {
  constructor() {
    this.uploadDir = path.resolve(
      process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads')
    );
    this.baseUrl = process.env.LOCAL_UPLOAD_BASE_URL || '/uploads';

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(buffer, { mimetype, originalname } = {}) {
    const ext = path.extname(originalname || '') || this._extFromMime(mimetype);
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

    const filePath = path.join(this.uploadDir, name);
    await fs.promises.writeFile(filePath, buffer);

    return {
      url: `${this.baseUrl}/${name}`,
      filename: name,
    };
  }

  async delete(filename) {
    const filePath = path.join(this.uploadDir, filename);
    try {
      await fs.promises.unlink(filePath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  _extFromMime(mimetype) {
    const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    return map[mimetype] || '.bin';
  }
}

module.exports = LocalUploader;
export default LocalUploader;