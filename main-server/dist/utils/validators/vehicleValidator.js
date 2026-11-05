"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleUpdateValidation = void 0;
const express_validator_1 = require("express-validator");
const constants_1 = require("../../config/constants");
const validation_keys_1 = __importDefault(require("../../config/messages/validation-keys"));
exports.vehicleUpdateValidation = [
    (0, express_validator_1.param)('vehicle_id').isUUID().withMessage(validation_keys_1.default.VEHICLE_ID_MUST_BE_A_VALID_UUID),
    (0, express_validator_1.body)('manufacturer').optional().isString().trim().isLength({ max: 80 }).withMessage(validation_keys_1.default.MANUFACTURER_MUST_BE_A_STRING_80_CHARACTERS),
    (0, express_validator_1.body)('model').optional().isString().trim().isLength({ max: 80 }).withMessage(validation_keys_1.default.MODEL_MUST_BE_A_STRING_80_CHARACTERS),
    (0, express_validator_1.body)('vehicle_type').optional().isIn(Object.values(constants_1.VEHICLE_TYPES)).withMessage(validation_keys_1.default.VEHICLE_TYPE_MUST_BE_ONE_OF_SEDAN_SUV_VAN_BUS_HATCHBACK),
    (0, express_validator_1.body)('model_year')
        .optional()
        .isInt().withMessage(validation_keys_1.default.MODEL_YEAR_MUST_BE_A_VALID_YEAR_2)
        .custom((value) => {
        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 10;
        if (Number(value) < minYear || Number(value) > currentYear) {
            throw new Error(`model_year must be between ${minYear} and ${currentYear} (within the last 10 years)`);
        }
        return true;
    }),
    (0, express_validator_1.body)('plate_number').optional().isString().trim().isLength({ max: 20 }).withMessage(validation_keys_1.default.PLATE_NUMBER_MUST_BE_A_STRING_20_CHARACTERS),
    (0, express_validator_1.body)('code_number').optional().isString().trim().isLength({ max: 20 }).withMessage(validation_keys_1.default.CODE_NUMBER_MUST_BE_A_STRING_20_CHARACTERS),
    (0, express_validator_1.body)('color').optional().isString().trim().isLength({ max: 30 }).withMessage(validation_keys_1.default.COLOR_MUST_BE_A_STRING_30_CHARACTERS),
    (0, express_validator_1.body)('seats').optional().isInt({ min: 1, max: 50 }).withMessage(validation_keys_1.default.SEATS_MUST_BE_AN_INTEGER_BETWEEN_1_AND_50),
];
const _exported = { vehicleUpdateValidation: exports.vehicleUpdateValidation };
exports.default = _exported;
// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = { vehicleUpdateValidation: exports.vehicleUpdateValidation };
    // @ts-ignore
    module.exports.vehicleUpdateValidation = exports.vehicleUpdateValidation;
    // @ts-ignore
    module.exports.default = _exported;
}
//# sourceMappingURL=vehicleValidator.js.map