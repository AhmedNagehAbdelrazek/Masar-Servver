const router = require('express').Router();
const c = require('../Controllers/tripController');
const protect = require('../middlewares/protect');
const { roleGuard } = require('../middlewares/roleGuard');
const validate = require('../middlewares/validatorMiddleware');
const { createTripValidation } = require('../utils/validators/tripValidator');

// Create trip (driver only)
router.post('/', protect, roleGuard(['driver']), ...createTripValidation, validate, c.createTrip);

// Get trip by ID
router.get('/:trip_id', protect, c.getTripById);

// Get driver's trips
router.get('/driver/my-trips', protect, roleGuard(['driver']), c.getDriverTrips);

// Search available trips (passengers)
router.get('/search/available', protect, c.getAvailableTrips);

module.exports = router;
