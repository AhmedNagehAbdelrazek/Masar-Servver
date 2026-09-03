"use strict";
const router = require('express').Router();
const c = require('../Controllers/notificationController');
const protect = require('../middlewares/protect');
const validate = require('../middlewares/validatorMiddleware');
const { updateNotificationSettingsValidation, } = require('../utils/validators/notificationValidator');
router.get('/', protect, validate, c.listNotifications);
router.put('/:notification_id/read', protect, ...updateNotificationSettingsValidation, validate, c.markRead);
module.exports = router;
//# sourceMappingURL=notificationRoutes.js.map