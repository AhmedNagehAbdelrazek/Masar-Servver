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
const planRoutes = require('./planRoutes');
const paymentMethodRoutes = require('./paymentMethodRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const adminSubscriptionRoutes = require('./adminSubscriptionRoutes');

router.use('/healthz', healthRoutes);
router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/trips', tripRoutes);
router.use('/driver/dashboard', dashboardRoutes);
router.use('/trips', seatLockRoutes);
router.use('/plans', planRoutes);
router.use('/payment-methods', paymentMethodRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/admin', adminSubscriptionRoutes);

module.exports = router;
