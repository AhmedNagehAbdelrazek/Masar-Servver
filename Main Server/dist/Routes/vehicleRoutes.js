"use strict";
const router = require('express').Router();
const c = require('../Controllers/vehicleController');
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const { vehicleUpdateValidation } = require('../utils/validators/vehicleValidator');
router.get('/', protect, roleGuard(['driver']), c.listVehicles);
router.put('/:vehicle_id', protect, roleGuard(['driver']), ...vehicleUpdateValidation, validate, c.updateVehicle);
module.exports = router;
//# sourceMappingURL=vehicleRoutes.js.map