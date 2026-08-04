const router = require('express').Router();
const c = require('../Controllers/tripController');
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const { createTripValidation, updateTripValidation, tripParamValidation, searchAvailableTripsValidation } = require('../utils/validators/tripValidator');

// Create trip (driver only)
router.post('/', protect, roleGuard(['driver']), ...createTripValidation, validate, c.createTrip);

// Get driver's trips
router.get('/driver/my-trips', protect, roleGuard(['driver']), c.getDriverTrips);

// Search available trips (passengers)
router.get('/search/available', protect, ...searchAvailableTripsValidation, validate, c.getAvailableTrips);

// Get trip by ID
router.get('/:trip_id', protect, c.getTripById);

// Start a trip (driver only)
router.post('/:trip_id/start', protect, roleGuard(['driver']), c.startTrip);

// Complete a trip (driver only)
router.post('/:trip_id/complete', protect, roleGuard(['driver']), c.completeTrip);

// Edit a trip (driver owner only)
router.put('/:trip_id', protect, roleGuard(['driver']), ...updateTripValidation, validate, c.updateTrip);

// Cancel a trip (driver owner only)
router.delete('/:trip_id', protect, roleGuard(['driver']), ...tripParamValidation, validate, c.cancelTrip);

// Trip attributes (any authenticated user)
router.get('/:trip_id/attributes', protect, ...tripParamValidation, validate, c.getTripAttributes);

module.exports = router;
