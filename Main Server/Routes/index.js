const router = require('express').Router();
const protect = require('../middlewares/protect');
const roleGuard = require('../middlewares/roleGuard');
const { permissionGuard } = require('../middlewares/roleGuard');
const { ROLES } = require('../config/constants');

const uploadRoutes = require('./uploadRoutes');
const authRoutes = require('./authRoutes');
const healthRoutes = require('./healthRoutes');
const tripRoutes = require('./tripRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const seatLockRoutes = require('./seatLockRoutes');

router.use('/healthz', healthRoutes);
router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/trips', tripRoutes);
router.use('/driver/dashboard', dashboardRoutes);
router.use('/trips', seatLockRoutes);

module.exports = router;
