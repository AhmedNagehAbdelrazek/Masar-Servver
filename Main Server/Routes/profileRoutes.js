const router = require('express').Router();
const protect = require('../middlewares/protect');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const c = require('../Controllers/passengerProfileController');
const { updatePassengerProfileValidation } = require('../utils/validators/profileValidator');

router.use(protect);

router.get('/', roleGuard(['passenger']), c.getMyProfile);
router.put('/', roleGuard(['passenger']), ...updatePassengerProfileValidation, validate, c.updateMyProfile);

module.exports = router;
