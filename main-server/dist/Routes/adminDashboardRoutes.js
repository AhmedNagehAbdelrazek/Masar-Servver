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
const c = __importStar(require("../Controllers/adminDashboardController"));
const protect_1 = __importDefault(require("../middlewares/protect"));
const roleGuard_1 = require("../middlewares/roleGuard");
const validatorMiddleware_1 = __importDefault(require("../middlewares/validatorMiddleware"));
const adminDashboardValidator_1 = require("../utils/validators/adminDashboardValidator");
// ===== US1: Global dashboard =====
router.get('/summary', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), c.getSummary);
router.get('/recent-trips', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.recentTripsQueryValidation, validatorMiddleware_1.default, c.getRecentTrips);
router.get('/top-routes', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), c.getTopRoutes);
router.get('/pending-requests', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.recentTripsQueryValidation, validatorMiddleware_1.default, c.getPendingRequests);
router.get('/latest-complaints', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.recentTripsQueryValidation, validatorMiddleware_1.default, c.getLatestComplaints);
// ===== US2: Drivers directory (static routes BEFORE :driver_id) =====
router.get('/drivers', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driversListValidation, validatorMiddleware_1.default, c.listDrivers);
router.get('/drivers/stats/summary', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), c.getDriverStats);
// ===== US3: Driver dossier =====
router.get('/drivers/:driver_id', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driverIdParamValidation, validatorMiddleware_1.default, c.getDriverHeader);
router.get('/drivers/:driver_id/overview', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driverIdParamValidation, validatorMiddleware_1.default, c.getDriverOverview);
router.get('/drivers/:driver_id/trips', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driverIdParamValidation, ...adminDashboardValidator_1.driverTripsQueryValidation, validatorMiddleware_1.default, c.listDriverTrips);
router.get('/drivers/:driver_id/evaluations', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driverIdParamValidation, ...adminDashboardValidator_1.recentTripsQueryValidation, validatorMiddleware_1.default, c.getDriverEvaluations);
router.get('/drivers/:driver_id/account-log', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driverIdParamValidation, validatorMiddleware_1.default, c.getAccountLog);
router.get('/drivers/:driver_id/car', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driverIdParamValidation, validatorMiddleware_1.default, c.getCarDetails);
router.get('/drivers/:driver_id/documents', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driverIdParamValidation, validatorMiddleware_1.default, c.getDocuments);
// ===== US4: Actions =====
router.post('/drivers/:driver_id/status', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driverIdParamValidation, ...adminDashboardValidator_1.statusBodyValidation, validatorMiddleware_1.default, c.setDriverStatus);
router.post('/drivers/:driver_id/account-status', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driverIdParamValidation, ...adminDashboardValidator_1.accountActionBodyValidation, validatorMiddleware_1.default, c.applyStandingAction);
router.post('/drivers/:driver_id/documents/:document_key/approve', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driverIdParamValidation, ...adminDashboardValidator_1.documentKeyParamValidation, validatorMiddleware_1.default, c.approveDocument);
router.post('/drivers/:driver_id/documents/:document_key/reject', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.driverIdParamValidation, ...adminDashboardValidator_1.documentKeyParamValidation, ...adminDashboardValidator_1.rejectReasonBodyValidation, validatorMiddleware_1.default, c.rejectDocument);
// ===== US5: Shared listings =====
router.get('/reservations', protect_1.default, (0, roleGuard_1.roleGuard)(['admin']), ...adminDashboardValidator_1.reservationsQueryValidation, validatorMiddleware_1.default, c.listReservations);
exports.default = router;
module.exports = router;
//# sourceMappingURL=adminDashboardRoutes.js.map