const router = require('express').Router();
const c = require('../Controllers/authController');
const protect = require('../middlewares/protect');
const { signupValidation, loginValidation, updateProfileValidation } = require('../utils/validators/authValidator');
const validate = require('../middlewares/validatorMiddleware');


router.post('/signup',...signupValidation,validate, c.signup);
router.post('/login', c.login);
router.get('/me', protect, c.me);
router.patch('/me', protect, c.updateProfile);

module.exports = router;
