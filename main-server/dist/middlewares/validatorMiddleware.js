"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const ApiError_1 = require("../utils/ApiError");
const i18n_1 = require("../utils/i18n");
function validate(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const mode = (0, i18n_1.modeFor)(req);
        const details = errors.array().map((err) => {
            const e = err;
            return {
                field: e.path ?? '',
                message: (0, i18n_1.tValidation)(e.msg, mode),
                value: e.value,
            };
        });
        return next(ApiError_1.ApiErrors.validation('VALIDATION_FAILED', details));
    }
    next();
}
exports.default = validate;
module.exports = validate;
//# sourceMappingURL=validatorMiddleware.js.map