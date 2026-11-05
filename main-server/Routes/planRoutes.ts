import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/planController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';

router.get('/', protect, roleGuard(['driver']), c.listActivePlans);

export default router;
module.exports = router;
