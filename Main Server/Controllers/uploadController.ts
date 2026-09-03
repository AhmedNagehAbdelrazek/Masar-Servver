import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../utils/httpResponse';
import * as uploadService from '../Services/uploadService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string }; file?: Express.Multer.File };

interface UploadResult {
  id: string;
  filename: string;
  url: string;
  cached?: boolean;
  provider?: string;
}

const upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await (uploadService as unknown as { upload: (req: Request) => Promise<UploadResult> }).upload(req);
    (auditService as unknown as { track: (p: unknown) => void }).track({
      action: 'file.upload',
      resourceType: 'uploaded_image',
      resourceId: result.id,
      resourceLabel: result.filename,
      actorId: (req as AuthRequest).user?.id,
      actorType: (req as AuthRequest).user?.role || 'user',
      payload: {
        url: result.url,
        size: (req as AuthRequest).file?.size,
        mimetype: (req as AuthRequest).file?.mimetype,
        cached: result.cached,
        provider: result.provider,
      },
    });
    (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'uploaded_image', id: result.id, label: result.filename });
    successResponse(res, result);
  } catch (err) {
    (auditService as unknown as { track: (p: unknown) => void }).track({
      action: 'file.upload',
      resourceType: 'uploaded_image',
      resourceLabel: (req as AuthRequest).file?.originalname || 'upload',
      actorId: (req as AuthRequest).user?.id,
      actorType: (req as AuthRequest).user?.role || 'user',
      outcome: 'failure',
      error: (err as Error).message,
      payload: { reason: 'upload_failed' },
    });
    next(err);
  }
};

export { upload };
export default { upload };
