"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFavoriteRouteValidation = exports.routeParamValidation = exports.favoriteDriversListValidation = exports.addFavoriteDriverValidation = exports.driverParamValidation = void 0;
const express_validator_1 = require("express-validator");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
exports.driverParamValidation = [
    (0, express_validator_1.param)('driver_id')
        .isUUID().withMessage(validation_keys_1.default.DRIVER_ID_MUST_BE_A_VALID_UUID),
];
exports.addFavoriteDriverValidation = [
    (0, express_validator_1.body)('driver_id')
        .notEmpty().withMessage(validation_keys_1.default.DRIVER_ID_IS_REQUIRED)
        .isUUID().withMessage(validation_keys_1.default.DRIVER_ID_MUST_BE_A_VALID_UUID_2),
];
exports.favoriteDriversListValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage(validation_keys_1.default.PAGE_MUST_BE_A_POSITIVE_INTEGER),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage(validation_keys_1.default.LIMIT_MUST_BE_AN_INTEGER_BETWEEN_1_AND_100),
];
exports.routeParamValidation = [
    (0, express_validator_1.param)('origin_city')
        .isString().trim().notEmpty().withMessage(validation_keys_1.default.ORIGIN_CITY_IS_REQUIRED)
        .isLength({ max: 120 }).withMessage(validation_keys_1.default.ORIGIN_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.param)('destination_city')
        .isString().trim().notEmpty().withMessage(validation_keys_1.default.DESTINATION_CITY_IS_REQUIRED)
        .isLength({ max: 120 }).withMessage(validation_keys_1.default.DESTINATION_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
];
exports.addFavoriteRouteValidation = [
    (0, express_validator_1.body)('origin_city')
        .notEmpty().withMessage(validation_keys_1.default.ORIGIN_CITY_IS_REQUIRED)
        .isString().trim().isLength({ max: 120 }).withMessage(validation_keys_1.default.ORIGIN_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('destination_city')
        .notEmpty().withMessage(validation_keys_1.default.DESTINATION_CITY_IS_REQUIRED)
        .isString().trim().isLength({ max: 120 }).withMessage(validation_keys_1.default.DESTINATION_CITY_MUST_BE_AT_MOST_120_CHARACTERS),
    (0, express_validator_1.body)('label')
        .optional()
        .isString().trim().isLength({ max: 100 }).withMessage(validation_keys_1.default.LABEL_MUST_BE_AT_MOST_100_CHARACTERS),
];
const _exported = { driverParamValidation: exports.driverParamValidation, addFavoriteDriverValidation: exports.addFavoriteDriverValidation, favoriteDriversListValidation: exports.favoriteDriversListValidation, routeParamValidation: exports.routeParamValidation, addFavoriteRouteValidation: exports.addFavoriteRouteValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { driverParamValidation: exports.driverParamValidation, addFavoriteDriverValidation: exports.addFavoriteDriverValidation, favoriteDriversListValidation: exports.favoriteDriversListValidation, routeParamValidation: exports.routeParamValidation, addFavoriteRouteValidation: exports.addFavoriteRouteValidation };
    // @ts-ignore
    module.exports.driverParamValidation = exports.driverParamValidation;
    // @ts-ignore
    module.exports.addFavoriteDriverValidation = exports.addFavoriteDriverValidation;
    // @ts-ignore
    module.exports.favoriteDriversListValidation = exports.favoriteDriversListValidation;
    // @ts-ignore
    module.exports.routeParamValidation = exports.routeParamValidation;
    // @ts-ignore
    module.exports.addFavoriteRouteValidation = exports.addFavoriteRouteValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=favoriteValidator.js.map