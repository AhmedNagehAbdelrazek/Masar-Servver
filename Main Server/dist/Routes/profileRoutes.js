"use strict";
const router = require('express').Router();
const protect = require('../middlewares/protect');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const c = require('../Controllers/passengerProfileController');
const { updatePassengerProfileValidation } = require('../utils/validators/profileValidator');
router.use(protect);
router.get('/', roleGuard(['passenger']), c.getMyProfile);
router.put('/', roleGuard(['passenger']), ...updatePassengerProfileValidation, validate, c.updateMyProfile);
router.get('/account-summary', roleGuard(['passenger']), c.getAccountSummary);
router.get('/home', roleGuard(['passenger']), c.getPassengerHome);
module.exports = router;
//# sourceMappingURL=profileRoutes.js.map