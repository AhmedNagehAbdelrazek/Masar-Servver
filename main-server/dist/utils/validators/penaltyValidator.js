"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.penaltyValidation = exports.penaltyListValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
exports.penaltyListValidation = [
    (0, express_validator_1.query)('active')
        .optional()
        .isIn(['true', 'false']).withMessage(validation_keys_1.default.ACTIVE_MUST_BE_TRUE_OR_FALSE),
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.default.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.penaltyValidation = [
    (0, express_validator_1.body)('user_id')
        .isUUID().withMessage(validation_keys_1.default.USER_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('type')
        .notEmpty().withMessage(validation_keys_1.default.PENALTY_TYPE_IS_REQUIRED)
        .isIn(Object.values(constants_1.PENALTY_TYPES)).withMessage(validation_keys_1.default.TYPE_MUST_BE_ONE_OF_WARNING_SUSPENSION_BAN),
    (0, express_validator_1.body)('reason')
        .notEmpty().withMessage(validation_keys_1.default.REASON_IS_REQUIRED)
        .isLength({ max: 2000 }).withMessage(validation_keys_1.default.REASON_MUST_BE_AT_MOST_2000_CHARACTERS),
    (0, express_validator_1.body)('complaint_id')
        .optional()
        .isUUID().withMessage(validation_keys_1.default.COMPLAINT_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('details')
        .optional()
        .isString().trim().isLength({ max: 4000 }).withMessage(validation_keys_1.default.DETAILS_MUST_BE_AT_MOST_4000_CHARACTERS),
    (0, express_validator_1.body)('ends_at')
        .optional()
        .isISO8601().withMessage(validation_keys_1.default.ENDS_AT_MUST_BE_A_VALID_ISO_8601_DATETIME)
        .custom((value, { req }) => {
        const type = req.body.type;
        if (type === constants_1.PENALTY_TYPES.SUSPENSION && !value) {
            throw new Error(validation_keys_1.default.ENDS_AT_IS_REQUIRED_FOR_A_SUSPENSION);
        }
        if (type === constants_1.PENALTY_TYPES.BAN && value) {
            throw new Error(validation_keys_1.default.ENDS_AT_IS_FORBIDDEN_FOR_A_BAN_PERMANENT);
        }
        if (value && new Date(String(value)) <= new Date()) {
            throw new Error(validation_keys_1.default.ENDS_AT_MUST_BE_IN_THE_FUTURE);
        }
        return true;
    }),
];
const _exported = { penaltyListValidation: exports.penaltyListValidation, penaltyValidation: exports.penaltyValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { penaltyListValidation: exports.penaltyListValidation, penaltyValidation: exports.penaltyValidation };
    // @ts-ignore
    module.exports.penaltyListValidation = exports.penaltyListValidation;
    // @ts-ignore
    module.exports.penaltyValidation = exports.penaltyValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=penaltyValidator.js.map