import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/notificationController';
import protect from '../middlewares/protect';
import validate from '../middlewares/validatorMiddleware';
import { registerDeviceValidation, unregisterDeviceValidation } from '../utils/validators/notificationValidator';

router.get('/', protect, validate, c.listNotifications);
router.put('/:notification_id/read', protect, c.markRead);

// Push device registration (FCM token upsert / logout cleanup)
router.post('/device', protect, ...registerDeviceValidation, validate, c.registerDevice);
router.delete('/device', protect, ...unregisterDeviceValidation, validate, c.unregisterDevice);

export default router;
module.exports = router;
