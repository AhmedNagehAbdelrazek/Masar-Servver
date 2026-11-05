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
exports.upload = void 0;
const httpResponse_1 = require("../utils/httpResponse");
const uploadService = __importStar(require("../Services/uploadService"));
const auditService = __importStar(require("../Services/auditService"));
const upload = async (req, res, next) => {
    try {
        const result = await uploadService.upload(req);
        auditService.track({
            action: 'file.upload',
            resourceType: 'uploaded_image',
            resourceId: result.id,
            resourceLabel: result.filename,
            actorId: req.user?.id,
            actorType: req.user?.role || 'user',
            payload: {
                url: result.url,
                size: req.file?.size,
                mimetype: req.file?.mimetype,
                cached: result.cached,
                provider: result.provider,
            },
        });
        auditService.markResource(res, { type: 'uploaded_image', id: result.id, label: result.filename });
        (0, httpResponse_1.successResponse)(res, result);
    }
    catch (err) {
        auditService.track({
            action: 'file.upload',
            resourceType: 'uploaded_image',
            resourceLabel: req.file?.originalname || 'upload',
            actorId: req.user?.id,
            actorType: req.user?.role || 'user',
            outcome: 'failure',
            error: err.message,
            payload: { reason: 'upload_failed' },
        });
        next(err);
    }
};
exports.upload = upload;
exports.default = { upload };
//# sourceMappingURL=uploadController.js.map