import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/realtimeHealthController';

router.get('/realtime', c.realtimeHealth);

export default router;
module.exports = router;
