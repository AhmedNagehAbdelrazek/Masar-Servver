"use strict";
const router = require('express').Router();
const multer = require('multer');
const c = require('../Controllers/uploadController');
const protect = require('../middlewares/protect');
const upload = require('../middlewares/uploadMiddleware');
const ApiError = require('../utils/ApiError');
const { track } = require('../Services/auditService');
function multerErrorHandler(req, res, next) {
    upload.single('file')(req, res, (err) => {
        if (err) {
            const isSizeError = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE';
            const isTypeError = err instanceof ApiError;
            track({
                action: 'file.upload',
                resourceType: 'uploaded_image',
                resourceLabel: req.file?.originalname || 'upload',
                actorId: req.user?.id,
                actorType: req.user?.role || 'user',
                outcome: 'failure',
                error: err.message,
                payload: {
                    reason: isSizeError ? 'file_too_large' : isTypeError ? 'invalid_file_type' : 'upload_rejected',
                    size: req.file?.size,
                    mimetype: req.file?.mimetype,
                },
            });
            return next(err);
        }
        next();
    });
}
router.post('/', protect, multerErrorHandler, c.upload);
module.exports = router;
//# sourceMappingURL=uploadRoutes.js.map