"use strict";
const router = require('express').Router();
const c = require('../Controllers/complaintController');
const protect = require('../middlewares/protect');
const validate = require('../middlewares/validatorMiddleware');
const { complaintValidation } = require('../utils/validators/complaintValidator');
// File a complaint (any authenticated user)
router.post('/', protect, ...complaintValidation, validate, c.createComplaint);
module.exports = router;
//# sourceMappingURL=complaintRoutes.js.map