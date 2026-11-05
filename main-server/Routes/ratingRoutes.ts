import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/ratingController';
import protect from '../middlewares/protect';
import validate from '../middlewares/validatorMiddleware';
import { ratingValidation } from '../utils/validators/ratingValidator';

// Submit a rating for a booking (any authenticated user)
router.post('/', protect, ...ratingValidation, validate, c.createRating);

export default router;
module.exports = router;
