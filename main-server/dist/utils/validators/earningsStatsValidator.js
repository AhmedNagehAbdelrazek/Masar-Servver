"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.earningsQueryValidation = void 0;
const express_validator_1 = require("express-validator");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
exports.earningsQueryValidation = [
    (0, express_validator_1.query)('period')
        .optional()
        .isIn(['day', 'week', 'month']).withMessage(validation_keys_1.default.PERIOD_MUST_BE_DAY_WEEK_OR_MONTH),
    (0, express_validator_1.query)('from')
        .optional()
        .isISO8601().withMessage(validation_keys_1.default.FROM_MUST_BE_A_VALID_ISO_8601_DATE),
    (0, express_validator_1.query)('to')
        .optional()
        .isISO8601().withMessage(validation_keys_1.default.TO_MUST_BE_A_VALID_ISO_8601_DATE),
];
const _exported = { earningsQueryValidation: exports.earningsQueryValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { earningsQueryValidation: exports.earningsQueryValidation };
    // @ts-ignore
    module.exports.earningsQueryValidation = exports.earningsQueryValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=earningsStatsValidator.js.map