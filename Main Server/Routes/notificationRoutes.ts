import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/notificationController';
import protect from '../middlewares/protect';
import validate from '../middlewares/validatorMiddleware';
import { updateNotificationSettingsValidation, } from '../utils/validators/notificationValidator';

router.get('/', protect, validate, c.listNotifications);
router.put('/:notification_id/read', protect, ...updateNotificationSettingsValidation, validate, c.markRead);

export default router;
module.exports = router;
