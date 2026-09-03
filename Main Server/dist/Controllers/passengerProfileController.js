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
exports.getPassengerHome = exports.getAccountSummary = exports.updateMyProfile = exports.getMyProfile = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const passengerProfileService = __importStar(require("../Services/passengerProfileService"));
const homeService = __importStar(require("../Services/homeService"));
const auditService = __importStar(require("../Services/auditService"));
const getMyProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await passengerProfileService.getMyProfile(String(authReq.user?.id));
    auditService.markResource(res, { type: 'passenger_profile', id: authReq.user?.id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getMyProfile = getMyProfile;
const getAccountSummary = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await passengerProfileService.getAccountSummary(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getAccountSummary = getAccountSummary;
const updateMyProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await passengerProfileService.updateMyProfile(String(authReq.user?.id), req.body);
    auditService.markResource(res, { type: 'passenger_profile', id: result.passenger_profile.id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.updateMyProfile = updateMyProfile;
const getPassengerHome = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await homeService.getPassengerHome(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getPassengerHome = getPassengerHome;
exports.default = { getMyProfile, updateMyProfile, getAccountSummary, getPassengerHome };
//# sourceMappingURL=passengerProfileController.js.map