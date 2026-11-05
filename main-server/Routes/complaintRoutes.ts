import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/complaintController';
import protect from '../middlewares/protect';
import validate from '../middlewares/validatorMiddleware';
import { complaintValidation } from '../utils/validators/complaintValidator';

// File a complaint (any authenticated user)
router.post('/', protect, ...complaintValidation, validate, c.createComplaint);

export default router;
module.exports = router;
