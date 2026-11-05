import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/notificationSettingController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { updateNotificationSettingsValidation, updateGroupedNotificationValidation } from '../utils/validators/notificationValidator';

router.get('/', protect, c.getNotificationSettings);
router.put('/', protect, ...updateNotificationSettingsValidation, validate, c.updateNotificationSettings);

// Grouped settings screen (spec 010)
router.get('/grouped', protect, roleGuard(['driver']), c.getGroupedSettings);
router.put('/grouped', protect, roleGuard(['driver']), ...updateGroupedNotificationValidation, validate, c.updateGroupedSettings);

export default router;
module.exports = router;
