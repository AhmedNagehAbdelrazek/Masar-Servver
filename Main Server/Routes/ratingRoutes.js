const router = require('express').Router();
const c = require('../Controllers/ratingController');
const protect = require('../middlewares/protect');
const validate = require('../middlewares/validatorMiddleware');
const { ratingValidation } = require('../utils/validators/ratingValidator');

// Submit a rating for a booking (any authenticated user)
router.post('/', protect, ...ratingValidation, validate, c.createRating);

module.exports = router;
