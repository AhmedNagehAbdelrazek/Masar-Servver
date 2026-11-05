import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/vehicleController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { vehicleUpdateValidation } from '../utils/validators/vehicleValidator';

router.get('/', protect, roleGuard(['driver']), c.listVehicles);
router.put('/:vehicle_id', protect, roleGuard(['driver']), ...vehicleUpdateValidation, validate, c.updateVehicle);

export default router;
module.exports = router;
