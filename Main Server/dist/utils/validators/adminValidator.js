"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidation = void 0;
const express_validator_1 = require("express-validator");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
exports.loginValidation = [
    (0, express_validator_1.body)('username')
        .trim()
        .notEmpty()
        .withMessage(validation_keys_1.default.USERNAME_IS_REQUIRED),
    (0, express_validator_1.body)('password')
        .trim()
        .notEmpty()
        .withMessage(validation_keys_1.default.PASSWORD_IS_REQUIRED),
];
const _exported = { loginValidation: exports.loginValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { loginValidation: exports.loginValidation };
    // @ts-ignore
    module.exports.loginValidation = exports.loginValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=adminValidator.js.map