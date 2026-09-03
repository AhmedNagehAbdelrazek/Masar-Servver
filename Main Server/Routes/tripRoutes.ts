import { Router } from 'express';
const router: Router = Router();
import * as c from '../Controllers/tripController';
import protect from '../middlewares/protect';
import { roleGuard } from '../middlewares/roleGuard';
import validate from '../middlewares/validatorMiddleware';
import { createTripValidation, updateTripValidation, tripParamValidation, tripPassengersValidation, searchAvailableTripsValidation, cancelTripValidation } from '../utils/validators/tripValidator';
import { param } from 'express-validator';

// Create trip (driver only)
router.post('/', protect, roleGuard(['driver']), ...createTripValidation, validate, c.createTrip);

// Get driver's trips
router.get('/driver/my-trips', protect, roleGuard(['driver']), c.getDriverTrips);

// Search available trips (passengers)
router.get('/search/available', protect, ...searchAvailableTripsValidation, validate, c.getAvailableTrips);

// Get trip by ID
router.get('/:trip_id', protect, ...tripParamValidation, validate, c.getTripById);

// Booking options for a trip: open seats + drop-off points (any authenticated user)
router.get('/:trip_id/options', protect, ...tripParamValidation, validate, c.getTripOptions);

// Start a trip (driver only)
router.post('/:trip_id/start', protect, roleGuard(['driver']), c.startTrip);

// Complete a trip (driver only)
router.post('/:trip_id/complete', protect, roleGuard(['driver']), c.completeTrip);

// Edit a trip (driver owner only)
router.put('/:trip_id', protect, roleGuard(['driver']), ...updateTripValidation, validate, c.updateTrip);

// Cancel a trip with penalty (driver owner only)
router.post('/:trip_id/cancel', protect, roleGuard(['driver']), ...cancelTripValidation, validate, c.cancelTripWithPenalty);

// Cancel a trip (driver owner only)
router.delete('/:trip_id', protect, roleGuard(['driver']), ...tripParamValidation, validate, c.cancelTrip);

// Trip attributes (any authenticated user)
router.get('/:trip_id/attributes', protect, ...tripParamValidation, validate, c.getTripAttributes);

// Trip passengers for dropdown selection (driver owner only)
router.get('/:trip_id/passengers', protect, roleGuard(['driver']), ...tripPassengersValidation, validate, c.getTripPassengers);

// Attach an accepted ride-request offer to this trip (driver owner only, deferred materialization)
const attachOfferValidation = [
  ...tripParamValidation,
  param('offer_id').isUUID().withMessage('Offer ID must be a valid UUID'),
];
router.post('/:trip_id/offers/:offer_id/attach', protect, roleGuard(['driver']), ...attachOfferValidation, validate, c.attachOfferToTrip);

export default router;
module.exports = router;
