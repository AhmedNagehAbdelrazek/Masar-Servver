import { Request } from 'express';
import multer, { FileFilterCallback, StorageEngine } from 'multer';
import { ApiErrors } from '../utils/ApiError';

const storage: StorageEngine = multer.memoryStorage();

const MAX_FILE_SIZE: number = 10 * 1024 * 1024;

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  const allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiErrors.custom('ONLY_JPEG_PNG_WEBP_AND_GIF_IMAGES_ARE_ALLOWED', 400, 'INVALID_FILE_TYPE'),
    );
  }
};

const upload: multer.Multer = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export default upload;
module.exports = upload;
