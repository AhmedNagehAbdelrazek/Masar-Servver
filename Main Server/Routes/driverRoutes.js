const router = require('express').Router();
const c = require('../Controllers/driverController');
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const { bookingListValidation, bookingParamValidation } = require('../utils/validators/bookingValidator');
const { ratingListValidation } = require('../utils/validators/ratingValidator');
const { penaltyListValidation } = require('../utils/validators/penaltyValidator');
const { driverComplaintListValidation } = require('../utils/validators/complaintValidator');
const { earningsQueryValidation } = require('../utils/validators/earningsStatsValidator');
const rideRequestController = require('../Controllers/rideRequestController');
const { driverOffersListValidation } = require('../utils/validators/rideRequestValidator');

// Driver bookings (driver only)
router.get('/bookings', protect, roleGuard(['driver']), ...bookingListValidation, validate, c.getBookings);
router.get('/bookings/:booking_id', protect, roleGuard(['driver']), ...bookingParamValidation, validate, c.getBookingById);

// Ride-request offers sent by this driver
router.get('/offers', protect, roleGuard(['driver']), ...driverOffersListValidation, validate, rideRequestController.listMyOffers);

// Ratings received (driver only)
router.get('/ratings', protect, roleGuard(['driver']), ...ratingListValidation, validate, c.getRatings);

// Penalties (driver only)
router.get('/penalties', protect, roleGuard(['driver']), ...penaltyListValidation, validate, c.getPenalties);

// Complaints (driver only)
router.get('/complaints', protect, roleGuard(['driver']), ...driverComplaintListValidation, validate, c.getComplaints);

// Earnings & stats (driver only)
router.get('/earnings', protect, roleGuard(['driver']), ...earningsQueryValidation, validate, c.getEarnings);
router.get('/stats', protect, roleGuard(['driver']), c.getStats);

// Aggregated profile (driver only)
router.get('/profile', protect, roleGuard(['driver']), c.getProfile);

// Driver home screen (driver, verified, active) + subscription details
router.get('/home', protect, roleGuard(['driver']), c.getHome);
router.get('/subscription', protect, roleGuard(['driver']), c.getSubscription);

module.exports = router;
