import { Router, Request, Response, NextFunction } from 'express';
const router: Router = Router();
import multer from 'multer';
import * as c from '../Controllers/uploadController';
import protect from '../middlewares/protect';
import upload from '../middlewares/uploadMiddleware';
import ApiError from '../utils/ApiError';
import { track } from '../Services/auditService';

function multerErrorHandler(req: Request, res: Response, next: NextFunction): void {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const isSizeError =
        err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE';
      const isTypeError = err instanceof ApiError;

      (track as unknown as (p: Record<string, unknown>) => void)({
        action: 'file.upload',
        resourceType: 'uploaded_image',
        resourceLabel: (req as unknown as { file?: { originalname: string } }).file?.originalname || 'upload',
        actorId: (req as unknown as { user?: { id: string } }).user?.id,
        actorType: (req as unknown as { user?: { role: string } }).user?.role || 'user',
        outcome: 'failure',
        error: (err as Error).message,
        payload: {
          reason: isSizeError ? 'file_too_large' : isTypeError ? 'invalid_file_type' : 'upload_rejected',
          size: (req as unknown as { file?: { size: number } }).file?.size,
          mimetype: (req as unknown as { file?: { mimetype: string } }).file?.mimetype,
        },
      });

      return next(err);
    }
    next();
  });
}

router.post('/', protect, multerErrorHandler, c.upload);

export default router;
module.exports = router;
