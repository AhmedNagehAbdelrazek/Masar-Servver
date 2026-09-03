import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/adminVerificationController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { verificationQueueValidation, driverParamValidation, vehicleParamValidation, rejectValidation, } from '../utils/validators/verificationValidator';

// Verification queue
router.get('/queue', protect, roleGuard(['admin']), ...verificationQueueValidation, validate, c.getQueue);

// Approve / reject driver
router.post('/drivers/:driver_id/approve', protect, roleGuard(['admin']), ...driverParamValidation, validate, c.approveDriver);
router.post('/drivers/:driver_id/reject', protect, roleGuard(['admin']), ...driverParamValidation, ...rejectValidation, validate, c.rejectDriver);

// Approve / reject vehicle
router.post('/vehicles/:vehicle_id/approve', protect, roleGuard(['admin']), ...vehicleParamValidation, validate, c.approveVehicle);
router.post('/vehicles/:vehicle_id/reject', protect, roleGuard(['admin']), ...vehicleParamValidation, ...rejectValidation, validate, c.rejectVehicle);

export default router;
module.exports = router;
