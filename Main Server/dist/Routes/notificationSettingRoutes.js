"use strict";
const router = require('express').Router();
const c = require('../Controllers/notificationSettingController');
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const { updateNotificationSettingsValidation, updateGroupedNotificationValidation } = require('../utils/validators/notificationValidator');
router.get('/', protect, c.getNotificationSettings);
router.put('/', protect, ...updateNotificationSettingsValidation, validate, c.updateNotificationSettings);
// Grouped settings screen (spec 010)
router.get('/grouped', protect, roleGuard(['driver']), c.getGroupedSettings);
router.put('/grouped', protect, roleGuard(['driver']), ...updateGroupedNotificationValidation, validate, c.updateGroupedSettings);
module.exports = router;
//# sourceMappingURL=notificationSettingRoutes.js.map