"use strict";
const router = require('express').Router();
const c = require('../Controllers/sosController');
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const { sosListValidation, sosIdParamValidation, resolveSosValidation, } = require('../utils/validators/sosValidator');
// SOS management (admin only)
router.get('/sos', protect, roleGuard(['admin']), ...sosListValidation, validate, c.listSos);
router.post('/sos/:id/ack', protect, roleGuard(['admin']), ...sosIdParamValidation, validate, c.ackSos);
router.post('/sos/:id/resolve', protect, roleGuard(['admin']), ...resolveSosValidation, validate, c.resolveSos);
module.exports = router;
//# sourceMappingURL=sosRoutes.js.map