"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const sequelize_1 = require("sequelize");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const i18n_1 = require("../utils/i18n");
const globalErrorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    const mode = (0, i18n_1.modeFor)(req);
    const error = err;
    if (error instanceof ApiError_1.default) {
        res.status(error.statusCode).json(error.toResponse(mode));
        return;
    }
    if (error instanceof sequelize_1.UniqueConstraintError) {
        const fields = error.errors.map((e) => e.path).join(', ');
        res.status(409).json({
            status: 'error',
            ...(0, i18n_1.shape)('DUPLICATE_VALUE_FOR', { fields }, mode),
            code: 'CONFLICT',
        });
        return;
    }
    if (error instanceof sequelize_1.ValidationError) {
        const details = error.errors.map((e) => ({
            field: e.path,
            message: (0, i18n_1.tValidation)(e.message, mode),
            value: e.value,
        }));
        res.status(422).json({
            status: 'error',
            ...(0, i18n_1.shape)('VALIDATION_FAILED', null, mode),
            code: 'VALIDATION_ERROR',
            details,
        });
        return;
    }
    if (error instanceof multer_1.default.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            res.status(413).json({
                status: 'error',
                ...(0, i18n_1.shape)('FILE_TOO_LARGE_10MB', null, mode),
                code: 'FILE_TOO_LARGE',
            });
            return;
        }
        res.status(400).json({
            status: 'error',
            message: (0, i18n_1.tValidation)(error.message, mode) || (0, i18n_1.shape)('INVALID_UPLOAD', null, mode).message,
            code: 'INVALID_UPLOAD',
        });
        return;
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        res.status(401).json({
            status: 'error',
            ...(0, i18n_1.shape)('INVALID_OR_EXPIRED_TOKEN', null, mode),
            code: 'UNAUTHORIZED',
        });
        return;
    }
    console.error('Unhandled error:', err);
    const statusCode = typeof error.statusCode === 'number' ? error.statusCode : 500;
    const rawMessage = process.env.NODE_ENV === 'development' ? error.message : null;
    const message = typeof rawMessage === 'string' ? rawMessage : (0, i18n_1.shape)('INTERNAL_ERROR', null, mode).message;
    res.status(statusCode).json({
        status: 'error',
        message,
        code: statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
};
exports.default = globalErrorHandler;
module.exports = globalErrorHandler;
//# sourceMappingURL=globalErrorHandler.js.map