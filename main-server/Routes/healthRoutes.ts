import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/healthController';

router.get('/', c.healthz);

export default router;
module.exports = router;
