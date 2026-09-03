"use strict";
const { body } = require('express-validator');
const V = require('../../config/messages/validation-keys');
const loginValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage(V.USERNAME_IS_REQUIRED),
    body('password')
        .trim()
        .notEmpty()
        .withMessage(V.PASSWORD_IS_REQUIRED),
];
module.exports = { loginValidation };
//# sourceMappingURL=adminValidator.js.map