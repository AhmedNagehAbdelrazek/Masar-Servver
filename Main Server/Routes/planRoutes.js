const router = require('express').Router();
const c = require('../Controllers/planController');
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');

router.get('/', protect, roleGuard(['driver']), c.listActivePlans);

module.exports = router;
