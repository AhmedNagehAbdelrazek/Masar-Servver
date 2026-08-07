const uploadService = require('../Services/uploadService');
const { successResponse } = require('../utils/httpResponse');
const { track } = require('../Services/auditService');

const upload = async (req, res, next) => {
  try {
    const result = await uploadService.upload(req);
    track({
      action: 'file.upload',
      resourceType: 'uploaded_image',
      resourceId: result.id,
      resourceLabel: result.filename,
      actorId: req.user?.id,
      actorType: req.user?.role || 'user',
      payload: {
        url: result.url,
        size: req.file?.size,
        mimetype: req.file?.mimetype,
        cached: result.cached,
        provider: result.provider,
      },
    });
    successResponse(res, result);
  } catch (err) {
    track({
      action: 'file.upload',
      resourceType: 'uploaded_image',
      resourceLabel: req.file?.originalname || 'upload',
      actorId: req.user?.id,
      actorType: req.user?.role || 'user',
      outcome: 'failure',
      error: err.message,
      payload: { reason: 'upload_failed' },
    });
    next(err);
  }
};

module.exports = { upload };
