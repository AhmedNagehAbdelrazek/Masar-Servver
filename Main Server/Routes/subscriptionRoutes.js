const router = require('express').Router();
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const c = require('../Controllers/subscriptionController');
const { createSubscriptionValidation } = require('../utils/validators/subscriptionValidator');

const driver = [protect, roleGuard(['driver'])];

router.post('/', ...driver, ...createSubscriptionValidation, validate, c.createSubscription);
router.get('/', ...driver, c.getMySubscriptions);
router.get('/current', ...driver, c.getCurrentSubscription);

module.exports = router;
