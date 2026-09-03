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
const c = __importStar(require("../Controllers/adminModerationController"));
const protect_1 = __importDefault(require("../middlewares/protect"));
const roleGuard_1 = require("../middlewares/roleGuard");
const validatorMiddleware_1 = __importDefault(require("../middlewares/validatorMiddleware"));
const complaintValidator_1 = require("../utils/validators/complaintValidator");
const penaltyValidator_1 = require("../utils/validators/penaltyValidator");
const adminModerationValidator_1 = require("../utils/validators/adminModerationValidator");
// Complaints (admin only)
router.get('/complaints', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...complaintValidator_1.adminComplaintListValidation, validatorMiddleware_1.default, c.listComplaints);
router.put('/complaints/:complaint_id', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...complaintValidator_1.resolveComplaintValidation, validatorMiddleware_1.default, c.resolveComplaint);
// Users (admin only)
router.get('/users', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminModerationValidator_1.adminUserListValidation, validatorMiddleware_1.default, c.listUsers);
router.put('/users/:user_id', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminModerationValidator_1.updateUserStatusValidation, validatorMiddleware_1.default, c.updateUserStatus);
// Trip moderation (admin only)
router.put('/trips/:trip_id', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminModerationValidator_1.moderateTripValidation, validatorMiddleware_1.default, c.moderateTrip);
// Penalties (admin only)
router.post('/penalties', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...penaltyValidator_1.penaltyValidation, validatorMiddleware_1.default, c.issuePenalty);
exports.default = router;
module.exports = router;
//# sourceMappingURL=adminModerationRoutes.js.map