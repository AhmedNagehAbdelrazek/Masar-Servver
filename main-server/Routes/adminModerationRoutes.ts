import { Router } from 'express';
import { body, param } from 'express-validator';
const router: Router = Router();
import * as c from '../Controllers/adminModerationController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { adminComplaintListValidation, resolveComplaintValidation, } from '../utils/validators/complaintValidator';
import { penaltyValidation } from '../utils/validators/penaltyValidator';
import {
  adminUserListValidation,
  adminUserIdValidation,
  updateAdminUserValidation,
  deleteAdminUserValidation,
  moderateTripValidation,
} from '../utils/validators/adminModerationValidator';

const complaintId = [param('complaint_id').isUUID().withMessage('COMPLAINT_ID_MUST_BE_A_VALID_UUID')];
const reopenBody = [body('reason').optional({ nullable: true }).isString().trim().isLength({ max: 2000 })];

// Complaints (admin only)
router.get('/complaints', protect, roleGuard(['admin']), ...adminComplaintListValidation, validate, c.listComplaints);
router.get('/complaints/stats', protect, roleGuard(['admin']), c.getComplaintStats);
router.get('/complaints/:complaint_id', protect, roleGuard(['admin']), ...complaintId, validate, c.getComplaintDetail);
router.post('/complaints/:complaint_id/penalties', protect, roleGuard(['admin']), ...complaintId, validate, c.penalizeComplaint);
router.post('/complaints/:complaint_id/reopen', protect, roleGuard(['admin']), ...complaintId, ...reopenBody, validate, c.reopenComplaint);
router.put('/complaints/:complaint_id', protect, roleGuard(['admin']), ...resolveComplaintValidation, validate, c.resolveComplaint);

// Users (admin only)
router.get('/users', protect, roleGuard(['admin']), ...adminUserListValidation, validate, c.listUsers);
router.get('/users/:user_id', protect, roleGuard(['admin']), ...adminUserIdValidation, validate, c.getUser);
router.put('/users/:user_id', protect, roleGuard(['admin']), ...updateAdminUserValidation, validate, c.updateUserStatus);
router.delete('/users/:user_id', protect, roleGuard(['admin']), ...deleteAdminUserValidation, validate, c.permanentlyDeleteUser);

// Trip moderation (admin only)
router.put('/trips/:trip_id', protect, roleGuard(['admin']), ...moderateTripValidation, validate, c.moderateTrip);

// Penalties (admin only)
router.post('/penalties', protect, roleGuard(['admin']), ...penaltyValidation, validate, c.issuePenalty);

export default router;
module.exports = router;
