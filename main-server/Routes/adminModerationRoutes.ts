import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/adminModerationController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { adminComplaintListValidation, resolveComplaintValidation, } from '../utils/validators/complaintValidator';
import { penaltyValidation } from '../utils/validators/penaltyValidator';
import { adminUserListValidation, updateUserStatusValidation, moderateTripValidation, } from '../utils/validators/adminModerationValidator';

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

export default router;
module.exports = router;
