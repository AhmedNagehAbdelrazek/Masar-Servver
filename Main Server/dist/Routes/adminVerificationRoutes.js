"use strict";
const router = require('express').Router();
const c = require('../Controllers/adminVerificationController');
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const { verificationQueueValidation, driverParamValidation, vehicleParamValidation, rejectValidation, } = require('../utils/validators/verificationValidator');
// Verification queue
router.get('/queue', protect, roleGuard(['admin']), ...verificationQueueValidation, validate, c.getQueue);
// Approve / reject driver
router.post('/drivers/:driver_id/approve', protect, roleGuard(['admin']), ...driverParamValidation, validate, c.approveDriver);
router.post('/drivers/:driver_id/reject', protect, roleGuard(['admin']), ...driverParamValidation, ...rejectValidation, validate, c.rejectDriver);
// Approve / reject vehicle
router.post('/vehicles/:vehicle_id/approve', protect, roleGuard(['admin']), ...vehicleParamValidation, validate, c.approveVehicle);
router.post('/vehicles/:vehicle_id/reject', protect, roleGuard(['admin']), ...vehicleParamValidation, ...rejectValidation, validate, c.rejectVehicle);
module.exports = router;
//# sourceMappingURL=adminVerificationRoutes.js.map