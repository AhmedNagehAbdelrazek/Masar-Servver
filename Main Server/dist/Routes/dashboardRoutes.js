"use strict";
const router = require('express').Router();
const c = require('../Controllers/dashboardController');
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
// Get driver dashboard
router.get('/', protect, roleGuard(['driver']), c.getDashboard);
module.exports = router;
//# sourceMappingURL=dashboardRoutes.js.map