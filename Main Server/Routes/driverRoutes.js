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

// Driver bookings (driver only)
router.get('/bookings', protect, roleGuard(['driver']), ...bookingListValidation, validate, c.getBookings);
router.get('/bookings/:booking_id', protect, roleGuard(['driver']), ...bookingParamValidation, validate, c.getBookingById);

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

module.exports = router;
