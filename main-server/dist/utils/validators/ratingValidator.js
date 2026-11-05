"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingListValidation = exports.ratingValidation = void 0;
const express_validator_1 = require("express-validator");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
exports.ratingValidation = [
    (0, express_validator_1.body)('booking_id')
        .isUUID().withMessage(validation_keys_1.default.BOOKING_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('stars')
        .notEmpty().withMessage(validation_keys_1.default.STARS_ARE_REQUIRED)
        .isInt({ min: 1, max: 5 }).withMessage(validation_keys_1.default.STARS_MUST_BE_AN_INTEGER_BETWEEN_1_AND_5),
    (0, express_validator_1.body)('was_late')
        .optional()
        .isBoolean().withMessage(validation_keys_1.default.WAS_LATE_MUST_BE_A_BOOLEAN),
    (0, express_validator_1.body)('late_minutes')
        .optional()
        .isInt({ min: 0 }).withMessage(validation_keys_1.default.LATE_MINUTES_MUST_BE_A_NON_NEGATIVE_INTEGER),
    (0, express_validator_1.body)('review')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage(validation_keys_1.default.REVIEW_MUST_BE_AT_MOST_500_CHARACTERS),
    (0, express_validator_1.body)('tags')
        .optional()
        .isArray().withMessage(validation_keys_1.default.TAGS_MUST_BE_AN_ARRAY)
        .custom((arr) => {
        if (!Array.isArray(arr) || !arr.every((item) => typeof item === 'string' && item.trim().length > 0)) {
            throw new Error(validation_keys_1.default.EACH_TAG_MUST_BE_A_NON_EMPTY_STRING);
        }
        return true;
    }),
];
exports.ratingListValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.default.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
    (0, express_validator_1.query)('sort')
        .optional()
        .isIn(['recent', 'highest', 'lowest']).withMessage(validation_keys_1.default.SORT_MUST_BE_RECENT_HIGHEST_OR_LOWEST),
];
const _exported = { ratingValidation: exports.ratingValidation, ratingListValidation: exports.ratingListValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { ratingValidation: exports.ratingValidation, ratingListValidation: exports.ratingListValidation };
    // @ts-ignore
    module.exports.ratingValidation = exports.ratingValidation;
    // @ts-ignore
    module.exports.ratingListValidation = exports.ratingListValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=ratingValidator.js.map