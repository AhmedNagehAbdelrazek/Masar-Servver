const router = require('express').Router();
const c = require('../Controllers/notificationSettingController');
const protect = require('../middlewares/protect');
const validate = require('../middlewares/validatorMiddleware');
const { updateNotificationSettingsValidation } = require('../utils/validators/notificationValidator');

router.get('/', protect, c.getNotificationSettings);
router.put('/', protect, ...updateNotificationSettingsValidation, validate, c.updateNotificationSettings);

module.exports = router;
