"use strict";
const router = require('express').Router();
const c = require('../Controllers/adminModerationController');
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const { adminComplaintListValidation, resolveComplaintValidation, } = require('../utils/validators/complaintValidator');
const { penaltyValidation } = require('../utils/validators/penaltyValidator');
const { adminUserListValidation, updateUserStatusValidation, moderateTripValidation, } = require('../utils/validators/adminModerationValidator');
// Complaints (admin only)
router.get('/complaints', protect, roleGuard(['admin']), ...adminComplaintListValidation, validate, c.listComplaints);
router.put('/complaints/:complaint_id', protect, roleGuard(['admin']), ...resolveComplaintValidation, validate, c.resolveComplaint);
// Users (admin only)
router.get('/users', protect, roleGuard(['admin']), ...adminUserListValidation, validate, c.listUsers);
router.put('/users/:user_id', protect, roleGuard(['admin']), ...updateUserStatusValidation, validate, c.updateUserStatus);
// Trip moderation (admin only)
router.put('/trips/:trip_id', protect, roleGuard(['admin']), ...moderateTripValidation, validate, c.moderateTrip);
// Penalties (admin only)
router.post('/penalties', protect, roleGuard(['admin']), ...penaltyValidation, validate, c.issuePenalty);
module.exports = router;
//# sourceMappingURL=adminModerationRoutes.js.map