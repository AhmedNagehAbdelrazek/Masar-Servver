const router = require('express').Router();
const protect = require('../middlewares/protect');
const roleGuard = require('../middlewares/roleGuard');
const { permissionGuard } = require('../middlewares/roleGuard');
const { ROLES } = require('../config/constants');

const uploadRoutes = require('./uploadRoutes');
const authRoutes = require('./authRoutes');
const healthRoutes = require('./healthRoutes');

router.use('/healthz', healthRoutes);
router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;
