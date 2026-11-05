"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSosValidation = exports.sosIdParamValidation = exports.sosListValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
exports.sosListValidation = [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(constants_1.SOS_STATUS)).withMessage(validation_keys_1.default.STATUS_MUST_BE_ONE_OF_PENDING_ACKNOWLEDGED_RESOLVED_CANCELLED),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.default.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.sosIdParamValidation = [
    (0, express_validator_1.param)('id')
        .isUUID().withMessage(validation_keys_1.default.SOS_EVENT_ID_MUST_BE_A_VALID_UUID),
];
exports.resolveSosValidation = [
    (0, express_validator_1.param)('id')
        .isUUID().withMessage(validation_keys_1.default.SOS_EVENT_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('resolution_note')
        .optional()
        .isString()
        .isLength({ max: 500 }).withMessage(validation_keys_1.default.RESOLUTION_NOTE_MUST_BE_AT_MOST_500_CHARACTERS),
];
const _exported = { sosListValidation: exports.sosListValidation, sosIdParamValidation: exports.sosIdParamValidation, resolveSosValidation: exports.resolveSosValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { sosListValidation: exports.sosListValidation, sosIdParamValidation: exports.sosIdParamValidation, resolveSosValidation: exports.resolveSosValidation };
    // @ts-ignore
    module.exports.sosListValidation = exports.sosListValidation;
    // @ts-ignore
    module.exports.sosIdParamValidation = exports.sosIdParamValidation;
    // @ts-ignore
    module.exports.resolveSosValidation = exports.resolveSosValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=sosValidator.js.map