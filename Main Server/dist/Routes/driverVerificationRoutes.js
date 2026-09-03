"use strict";
const router = require('express').Router();
const c = require('../Controllers/driverVerificationController');
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const { driverVerificationValidation } = require('../utils/validators/driverVerificationValidator');
// Driver verification status
router.get('/verification-status', protect, roleGuard(['driver']), c.getStatus);
// Driver current submission (form prefill)
router.get('/verification', protect, roleGuard(['driver']), c.getSubmission);
// Driver submit / resubmit verification package
router.put('/verification', protect, roleGuard(['driver']), ...driverVerificationValidation, validate, c.submit);
module.exports = router;
//# sourceMappingURL=driverVerificationRoutes.js.map