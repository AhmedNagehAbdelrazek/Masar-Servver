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
exports.listReservations = exports.rejectDocument = exports.approveDocument = exports.applyStandingAction = exports.setDriverStatus = exports.getDocuments = exports.getCarDetails = exports.getAccountLog = exports.getDriverEvaluations = exports.listDriverTrips = exports.getDriverOverview = exports.getDriverHeader = exports.getDriverStats = exports.listDrivers = exports.getLatestComplaints = exports.getPendingRequests = exports.getTopRoutes = exports.getRecentTrips = exports.getSummary = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const adminDashboardService = __importStar(require("../Services/adminDashboardService"));
const auditService = __importStar(require("../Services/auditService"));
const getSummary = (0, catchAsync_1.catchAsync)(async (req, res) => {
    (0, httpResponse_1.successResponse)(res, await adminDashboardService.getSummary());
});
exports.getSummary = getSummary;
const getRecentTrips = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await adminDashboardService.getRecentTrips(req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getRecentTrips = getRecentTrips;
const getTopRoutes = (0, catchAsync_1.catchAsync)(async (req, res) => {
    (0, httpResponse_1.successResponse)(res, await adminDashboardService.getTopRoutes());
});
exports.getTopRoutes = getTopRoutes;
const getPendingRequests = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await adminDashboardService.getPendingRequests(req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getPendingRequests = getPendingRequests;
const getLatestComplaints = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await adminDashboardService.getLatestComplaints(req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getLatestComplaints = getLatestComplaints;
const listDrivers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await adminDashboardService.listDrivers(req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listDrivers = listDrivers;
const getDriverStats = (0, catchAsync_1.catchAsync)(async (req, res) => {
    (0, httpResponse_1.successResponse)(res, await adminDashboardService.getDriverStats());
});
exports.getDriverStats = getDriverStats;
const getDriverHeader = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { driver_id } = req.params;
    (0, httpResponse_1.successResponse)(res, await adminDashboardService.getDriverHeader(driver_id));
});
exports.getDriverHeader = getDriverHeader;
const getDriverOverview = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { driver_id } = req.params;
    (0, httpResponse_1.successResponse)(res, await adminDashboardService.getDriverOverview(driver_id));
});
exports.getDriverOverview = getDriverOverview;
const listDriverTrips = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { driver_id } = req.params;
    const result = await adminDashboardService.listDriverTrips(driver_id, req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listDriverTrips = listDriverTrips;
const getDriverEvaluations = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { driver_id } = req.params;
    const result = await adminDashboardService.getDriverEvaluations(driver_id, req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getDriverEvaluations = getDriverEvaluations;
const getAccountLog = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { driver_id } = req.params;
    (0, httpResponse_1.successResponse)(res, await adminDashboardService.getAccountLog(driver_id));
});
exports.getAccountLog = getAccountLog;
const getCarDetails = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { driver_id } = req.params;
    (0, httpResponse_1.successResponse)(res, await adminDashboardService.getCarDetails(driver_id));
});
exports.getCarDetails = getCarDetails;
const getDocuments = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { driver_id } = req.params;
    (0, httpResponse_1.successResponse)(res, await adminDashboardService.getDocuments(driver_id));
});
exports.getDocuments = getDocuments;
const setDriverStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { driver_id } = req.params;
    const { status } = req.body;
    const result = await adminDashboardService.setDriverStatus(String(authReq.user?.id), driver_id, status);
    auditService.track({
        action: `dashboard.driver_status.${status}`,
        resourceType: 'driver',
        resourceId: driver_id,
        actorId: authReq.user?.id,
        payload: { status },
    });
    auditService.markResource(res, { type: 'driver', id: driver_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.setDriverStatus = setDriverStatus;
const applyStandingAction = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { driver_id } = req.params;
    const { action, reason } = req.body;
    const result = await adminDashboardService.applyStandingAction(String(authReq.user?.id), driver_id, action, reason);
    auditService.track({
        action: `dashboard.account_action.${action}`,
        resourceType: 'driver',
        resourceId: driver_id,
        actorId: authReq.user?.id,
        payload: { action, reason: reason || null },
    });
    auditService.markResource(res, { type: 'driver', id: driver_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.applyStandingAction = applyStandingAction;
const approveDocument = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { driver_id, document_key } = req.params;
    const result = await adminDashboardService.decideDocument(String(authReq.user?.id), driver_id, document_key, 'approved', null);
    auditService.track({
        action: 'dashboard.document.approve',
        resourceType: 'document_review',
        resourceId: `${driver_id}:${document_key}`,
        actorId: authReq.user?.id,
        payload: { document_key },
    });
    auditService.markResource(res, { type: 'document_review', id: `${driver_id}:${document_key}` });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.approveDocument = approveDocument;
const rejectDocument = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { driver_id, document_key } = req.params;
    const { reason } = req.body;
    const result = await adminDashboardService.decideDocument(String(authReq.user?.id), driver_id, document_key, 'rejected', reason);
    auditService.track({
        action: 'dashboard.document.reject',
        resourceType: 'document_review',
        resourceId: `${driver_id}:${document_key}`,
        actorId: authReq.user?.id,
        payload: { document_key, reason: reason || null },
    });
    auditService.markResource(res, { type: 'document_review', id: `${driver_id}:${document_key}` });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.rejectDocument = rejectDocument;
const listReservations = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await adminDashboardService.listReservations(req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listReservations = listReservations;
exports.default = {
    getSummary,
    getRecentTrips,
    getTopRoutes,
    getPendingRequests,
    getLatestComplaints,
    listDrivers,
    getDriverStats,
    getDriverHeader,
    getDriverOverview,
    listDriverTrips,
    getDriverEvaluations,
    getAccountLog,
    getCarDetails,
    getDocuments,
    setDriverStatus,
    applyStandingAction,
    approveDocument,
    rejectDocument,
    listReservations,
};
//# sourceMappingURL=adminDashboardController.js.map