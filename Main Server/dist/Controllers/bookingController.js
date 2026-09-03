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
exports.listDelays = exports.reportDelay = exports.getDriverProfile = exports.cancelBooking = exports.getBooking = exports.listMyBookings = exports.createBooking = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const bookingService = __importStar(require("../Services/bookingService"));
const delayService = __importStar(require("../Services/delayService"));
const auditService = __importStar(require("../Services/auditService"));
const createBooking = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const booking = await bookingService.createBooking(String(authReq.user?.id), req.body);
    auditService.markResource(res, { type: 'booking', id: booking.id, label: `booking ${booking.reference_code}` });
    (0, httpResponse_1.successResponse)(res, { booking }, 201);
});
exports.createBooking = createBooking;
const listMyBookings = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await bookingService.listForPassenger(String(authReq.user?.id), req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listMyBookings = listMyBookings;
const getBooking = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { booking_id } = req.params;
    const result = await bookingService.getForPassenger(String(authReq.user?.id), booking_id);
    auditService.markResource(res, { type: 'booking', id: booking_id, label: `booking ${result.booking.reference_code}` });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getBooking = getBooking;
const cancelBooking = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { booking_id } = req.params;
    const result = await bookingService.cancelBooking(String(authReq.user?.id), booking_id);
    auditService.markResource(res, { type: 'booking', id: booking_id, label: `booking ${result.booking.id}` });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.cancelBooking = cancelBooking;
const getDriverProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { booking_id } = req.params;
    const result = await bookingService.getDriverReveal(String(authReq.user?.id), String(authReq.user?.role), booking_id);
    auditService.markResource(res, { type: 'booking', id: booking_id, action: 'driver_profile_revealed' });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getDriverProfile = getDriverProfile;
const reportDelay = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { booking_id } = req.params;
    const delayEvent = await delayService.reportDelay(authReq.user, booking_id, req.body);
    auditService.markResource(res, { type: 'delay_event', id: delayEvent.id });
    (0, httpResponse_1.successResponse)(res, { delay_event: delayEvent }, 201);
});
exports.reportDelay = reportDelay;
const listDelays = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { booking_id } = req.params;
    const result = await delayService.listDelays(authReq.user, booking_id, req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listDelays = listDelays;
exports.default = { createBooking, listMyBookings, getBooking, cancelBooking, getDriverProfile, reportDelay, listDelays };
//# sourceMappingURL=bookingController.js.map