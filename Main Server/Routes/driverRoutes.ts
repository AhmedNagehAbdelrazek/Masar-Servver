import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/driverController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { bookingListValidation, bookingParamValidation } from '../utils/validators/bookingValidator';
import { ratingListValidation } from '../utils/validators/ratingValidator';
import { penaltyListValidation } from '../utils/validators/penaltyValidator';
import { driverComplaintListValidation } from '../utils/validators/complaintValidator';
import { earningsQueryValidation } from '../utils/validators/earningsStatsValidator';
import { updateDriverPersonalDataValidation } from '../utils/validators/profileValidator';
import * as rideRequestController from '../Controllers/rideRequestController';
import { driverOffersListValidation } from '../utils/validators/rideRequestValidator';

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

// Profile & settings screens (spec 010, driver only)
router.get('/profile/full', protect, roleGuard(['driver']), c.getFullProfile);
router.get('/personal-data', protect, roleGuard(['driver']), c.getPersonalData);
router.put('/personal-data', protect, roleGuard(['driver']), ...updateDriverPersonalDataValidation, validate, c.updatePersonalData);
router.get('/account-status', protect, roleGuard(['driver']), c.getAccountStatus);
router.post('/delete-account', protect, roleGuard(['driver']), c.requestDeleteAccount);
router.post('/delete-account/cancel', protect, roleGuard(['driver']), c.cancelDeleteAccount);

// Driver home screen (driver, verified, active) + subscription details
router.get('/home', protect, roleGuard(['driver']), c.getHome);
router.get('/subscription', protect, roleGuard(['driver']), c.getSubscription);

export default router;
module.exports = router;
