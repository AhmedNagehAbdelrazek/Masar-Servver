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
exports.rejectVehicle = exports.approveVehicle = exports.rejectDriver = exports.approveDriver = exports.getQueue = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const verificationService = __importStar(require("../Services/verificationService"));
const auditService = __importStar(require("../Services/auditService"));
const getQueue = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await verificationService.getQueue(req.query);
    (0, httpResponse_1.envelopeResponse)(res, result);
});
exports.getQueue = getQueue;
const approveDriver = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { driver_id } = req.params;
    const result = await verificationService.approveDriver(String(authReq.user?.id), driver_id);
    auditService.markResource(res, { type: 'driver_profile', id: driver_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.approveDriver = approveDriver;
const rejectDriver = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { driver_id } = req.params;
    const { reason, fields_to_fix } = req.body;
    const result = await verificationService.rejectDriver(String(authReq.user?.id), driver_id, reason, fields_to_fix);
    auditService.markResource(res, { type: 'driver_profile', id: driver_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.rejectDriver = rejectDriver;
const approveVehicle = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { vehicle_id } = req.params;
    const result = await verificationService.approveVehicle(String(authReq.user?.id), vehicle_id);
    auditService.markResource(res, { type: 'vehicle', id: vehicle_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.approveVehicle = approveVehicle;
const rejectVehicle = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { vehicle_id } = req.params;
    const { reason, fields_to_fix } = req.body;
    const result = await verificationService.rejectVehicle(String(authReq.user?.id), vehicle_id, reason, fields_to_fix);
    auditService.markResource(res, { type: 'vehicle', id: vehicle_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.rejectVehicle = rejectVehicle;
exports.default = { getQueue, approveDriver, rejectDriver, approveVehicle, rejectVehicle };
//# sourceMappingURL=adminVerificationController.js.map