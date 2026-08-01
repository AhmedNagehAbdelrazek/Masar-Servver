const router = require('express').Router();
const c = require('../Controllers/notificationController');
const protect = require('../middlewares/protect');
const validate = require('../middlewares/validatorMiddleware');
const {
  notificationListValidation,
  notificationParamValidation,
} = require('../utils/validators/notificationValidator');

router.get('/', protect, ...notificationListValidation, validate, c.listNotifications);
router.put('/:notification_id/read', protect, ...notificationParamValidation, validate, c.markRead);

module.exports = router;
