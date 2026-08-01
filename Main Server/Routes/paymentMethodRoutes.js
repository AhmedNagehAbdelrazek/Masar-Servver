const router = require('express').Router();
const c = require('../Controllers/paymentMethodController');

router.get('/', c.listActiveMethods);

module.exports = router;
