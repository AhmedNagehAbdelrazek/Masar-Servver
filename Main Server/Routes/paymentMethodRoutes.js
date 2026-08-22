const router = require('express').Router();
const protect = require('../middlewares/protect');
const roleGuard = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const c = require('../Controllers/paymentMethodController');
const v = require('../utils/validators/paymentMethodValidator');

// Authenticated catalog of active payment methods (US4: was public before spec 009)
router.get('/', protect, c.listActiveMethods);

// Admin CRUD
router.get('/all', protect, roleGuard(['admin']), c.listAllMethods);
router.post('/', protect, roleGuard(['admin']), ...v.createMethodValidation, validate, c.createMethod);
router.put('/:method_id', protect, roleGuard(['admin']), ...v.updateMethodValidation, validate, c.updateMethod);
router.delete('/:method_id', protect, roleGuard(['admin']), ...v.methodParamValidation, c.deactivateMethod);

module.exports = router;
