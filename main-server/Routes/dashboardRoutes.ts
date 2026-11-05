import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/dashboardController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';

// Get driver dashboard
router.get('/', protect, roleGuard(['driver']), c.getDashboard);

export default router;
module.exports = router;
