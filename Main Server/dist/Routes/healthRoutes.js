"use strict";
const router = require('express').Router();
const c = require('../Controllers/healthController');
router.get('/', c.healthz);
module.exports = router;
//# sourceMappingURL=healthRoutes.js.map