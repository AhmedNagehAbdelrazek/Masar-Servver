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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const multer_1 = __importDefault(require("multer"));
const c = __importStar(require("../Controllers/uploadController"));
const protect_1 = __importDefault(require("../middlewares/protect"));
const uploadMiddleware_1 = __importDefault(require("../middlewares/uploadMiddleware"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const auditService_1 = require("../Services/auditService");
function multerErrorHandler(req, res, next) {
    uploadMiddleware_1.default.single('file')(req, res, (err) => {
        if (err) {
            const isSizeError = err instanceof multer_1.default.MulterError && err.code === 'LIMIT_FILE_SIZE';
            const isTypeError = err instanceof ApiError_1.default;
            auditService_1.track({
                action: 'file.upload',
                resourceType: 'uploaded_image',
                resourceLabel: req.file?.originalname || 'upload',
                actorId: req.user?.id,
                actorType: req.user?.role || 'user',
                outcome: 'failure',
                error: err.message,
                payload: {
                    reason: isSizeError ? 'file_too_large' : isTypeError ? 'invalid_file_type' : 'upload_rejected',
                    size: req.file?.size,
                    mimetype: req.file?.mimetype,
                },
            });
            return next(err);
        }
        next();
    });
}
router.post('/', protect_1.default, multerErrorHandler, c.upload);
exports.default = router;
module.exports = router;
//# sourceMappingURL=uploadRoutes.js.map