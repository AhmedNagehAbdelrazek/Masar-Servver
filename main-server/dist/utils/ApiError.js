"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiErrors = exports.ApiError = void 0;
const i18n = __importStar(require("./i18n"));
class ApiError extends Error {
    statusCode;
    code;
    details;
    params;
    messageKey;
    isOperational;
    /**
     * `message` is either a key from config/messages (preferred) or raw text.
     * `params` fills {placeholders} inside the catalog entry. The English text
     * is kept on `.message` for logs/tests; the wire format is produced by
     * toResponse(mode) per APP_LOCALE / per-request language.
     */
    constructor(message, statusCode, code = null, details = null, params = null) {
        super(typeof message === 'string' ? message : String(message));
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = Array.isArray(details) && details.length > 0 ? details : null;
        this.params = params || null;
        this.messageKey = message != null ? String(message) : null;
        // Keep `.message` as the English rendering for logs/tests/wire-parity;
        // localized output is produced by toResponse(mode).
        this.message = i18n.t(this.messageKey, params || null, 'en');
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
    /** English rendering (for logs, tests, and .message parity). */
    resolvedMessage() {
        return i18n.t(this.messageKey, this.params, 'en');
    }
    /** Full error body in the requested locale mode. */
    toResponse(mode = i18n.defaultMode()) {
        return {
            status: 'error',
            ...i18n.shape(this.messageKey, this.params, mode),
            code: this.code,
            ...(this.details && { details: this.details }),
        };
    }
    toJSON() {
        return this.toResponse(i18n.defaultMode());
    }
}
exports.ApiError = ApiError;
exports.ApiErrors = {
    badRequest: (message = 'BAD_REQUEST', details = null, params = null) => new ApiError(message, 400, 'BAD_REQUEST', details, params),
    unauthorized: (message = 'UNAUTHORIZED', details = null, params = null) => new ApiError(message, 401, 'UNAUTHORIZED', details, params),
    forbidden: (message = 'FORBIDDEN', details = null, params = null) => new ApiError(message, 403, 'FORBIDDEN', details, params),
    notFound: (message = 'NOT_FOUND', details = null, params = null) => new ApiError(message, 404, 'NOT_FOUND', details, params),
    conflict: (message = 'CONFLICT', details = null, params = null) => new ApiError(message, 409, 'CONFLICT', details, params),
    validation: (message = 'VALIDATION_FAILED', details = null, params = null) => new ApiError(message, 422, 'VALIDATION_ERROR', details, params),
    serverError: (message = 'INTERNAL_ERROR', details = null, params = null) => new ApiError(message, 500, 'INTERNAL_ERROR', details, params),
    custom: (message = 'INTERNAL_ERROR', statusCode = 500, code = 'INTERNAL_ERROR', details = null, params = null) => new ApiError(message, statusCode, code, details, params),
};
exports.default = ApiError;
// CommonJS compatibility: preserve `const ApiError = require('../utils/ApiError')` and `const { ApiErrors } = require(...)`
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
    // @ts-ignore
    module.exports = ApiError;
    // @ts-ignore
    module.exports.ApiErrors = exports.ApiErrors;
    // @ts-ignore
    module.exports.ApiError = ApiError;
    // @ts-ignore
    module.exports.default = ApiError;
}
//# sourceMappingURL=ApiError.js.map