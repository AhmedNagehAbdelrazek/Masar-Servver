"use strict";
const router = require('express').Router();
const protect = require('../middlewares/protect');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const c = require('../Controllers/rideRequestController');
const { decideOfferValidation, agreePriceValidation } = require('../utils/validators/rideRequestValidator');
router.use(protect);
router.put('/:offer_id', roleGuard(['passenger']), ...decideOfferValidation, validate, c.decideOffer);
router.put('/:offer_id/price', roleGuard(['passenger']), ...agreePriceValidation, validate, c.agreePrice);
module.exports = router;
//# sourceMappingURL=offersRoutes.js.map