import { Router } from 'express';
import * as c from '../Controllers/adminSearchController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { adminSearchQueryValidation } from '../utils/validators/adminDashboardValidator';

const router: Router = Router();

router.get(
  '/search',
  protect,
  roleGuard(['admin']),
  ...adminSearchQueryValidation,
  validate,
  c.search,
);

export default router;
module.exports = router;
