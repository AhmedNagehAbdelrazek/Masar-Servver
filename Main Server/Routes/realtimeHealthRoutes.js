const router = require('express').Router();
const c = require('../Controllers/realtimeHealthController');

router.get('/realtime', c.realtimeHealth);

module.exports = router;
