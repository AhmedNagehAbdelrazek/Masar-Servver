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
exports.cancelDeleteAccount = exports.requestDeleteAccount = exports.getAccountStatus = exports.updatePersonalData = exports.getPersonalData = exports.getFullProfile = exports.getProfile = exports.getStats = exports.getEarnings = exports.getComplaints = exports.getPenalties = exports.getRatings = exports.getBookingById = exports.getBookings = exports.getSubscription = exports.getHome = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const ApiError_1 = require("../utils/ApiError");
const masking_1 = require("../utils/masking");
const bookingService = __importStar(require("../Services/bookingService"));
const ratingService = __importStar(require("../Services/ratingService"));
const penaltyService = __importStar(require("../Services/penaltyService"));
const complaintService = __importStar(require("../Services/complaintService"));
const earningsService = __importStar(require("../Services/earningsService"));
const statsService = __importStar(require("../Services/statsService"));
const homeService = __importStar(require("../Services/homeService"));
const driverProfileService = __importStar(require("../Services/driverProfileService"));
const personalDataService = __importStar(require("../Services/personalDataService"));
const deletionRequestService = __importStar(require("../Services/deletionRequestService"));
const auditService = __importStar(require("../Services/auditService"));
const Models_1 = require("../Models");
async function assertDriverEligible(userId) {
    const user = await Models_1.User.findByPk(userId);
    if (!user)
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    if (user['isVerified'] !== true || ['suspended', 'banned'].includes(user['status'])) {
        throw ApiError_1.ApiErrors.forbidden('ACCOUNT_MUST_BE_VERIFIED_AND_ACTIVE_TO_ACCESS_THIS_RESOURCE');
    }
    return user;
}
const getHome = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    await assertDriverEligible(String(authReq.user?.id));
    const result = await homeService.getHome(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getHome = getHome;
const getSubscription = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    await assertDriverEligible(String(authReq.user?.id));
    const result = await homeService.getSubscription(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getSubscription = getSubscription;
const getBookings = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await bookingService.listForDriver(String(authReq.user?.id), req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getBookings = getBookings;
const getBookingById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { booking_id } = req.params;
    const result = await bookingService.getForDriver(String(authReq.user?.id), booking_id);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getBookingById = getBookingById;
const getRatings = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await ratingService.listWithDistribution(String(authReq.user?.id), req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getRatings = getRatings;
const getFullProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await driverProfileService.getFullProfile(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getFullProfile = getFullProfile;
const getPersonalData = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await personalDataService.buildPersonalDataView(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getPersonalData = getPersonalData;
const updatePersonalData = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await personalDataService.updatePersonalData(String(authReq.user?.id), req.body);
    auditService.markResource(res, { type: 'user', id: authReq.user?.id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.updatePersonalData = updatePersonalData;
const getAccountStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await driverProfileService.getAccountStatus(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getAccountStatus = getAccountStatus;
const requestDeleteAccount = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const body = req.body;
    const reason = typeof body.reason === 'string' ? body.reason : null;
    const confirmation = body.confirmation === true;
    const result = await deletionRequestService.requestDeletion(String(authReq.user?.id), { reason, confirmation });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.requestDeleteAccount = requestDeleteAccount;
const cancelDeleteAccount = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await deletionRequestService.cancelDeletionRequest(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.cancelDeleteAccount = cancelDeleteAccount;
const getPenalties = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await penaltyService.listForDriver(String(authReq.user?.id), req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getPenalties = getPenalties;
const getComplaints = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await complaintService.listForDriver(String(authReq.user?.id), req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getComplaints = getComplaints;
const getEarnings = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await earningsService.aggregate(String(authReq.user?.id), req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getEarnings = getEarnings;
const getStats = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await statsService.lifetime(String(authReq.user?.id));
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getStats = getStats;
const getProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const user = await Models_1.User.findByPk(String(authReq.user?.id), {
        include: [{ model: Models_1.DriverProfile, as: 'driverProfile' }],
    });
    if (!user)
        throw ApiError_1.ApiErrors.notFound('USER_NOT_FOUND');
    const ratingCount = await Models_1.Rating.count({ where: { ratee_id: authReq.user?.id } });
    const profile = user['driverProfile'] || {};
    const vehicles = await Models_1.Vehicle.findAll({ where: { driver_id: authReq.user?.id } });
    const isVerifiedCheck = (v) => Boolean(v['isVerified']);
    const identityVerified = Boolean(profile['idVerified']);
    const vehicleVerified = vehicles.some(isVerifiedCheck);
    const data = {
        profile: {
            user: {
                id: user['id'],
                full_name: user['fullName'],
                phone: (0, masking_1.maskPhone)(user['phone']),
                role: user['role'],
                status: user['status'],
                avg_rating: Number(user['avgRating'] || 0),
            },
            driver: {
                id_verified: Boolean(profile['idVerified']),
                license_expiry: profile['licenseExpiry'] || null,
                total_trips: profile['totalTrips'] || 0,
                total_earnings: Number(profile['totalEarnings'] || 0),
                response_rate: Number(profile['responseRate'] || 0),
                national_id: (0, masking_1.maskNationalId)(profile['nationalID']),
            },
            verification: {
                identity_verified: identityVerified,
                vehicle_verified: vehicleVerified,
                fully_verified: identityVerified && vehicleVerified,
            },
            vehicles: vehicles.map((v) => ({
                id: v['id'],
                manufacturer: v['manufacturer'],
                model: v['model'],
                vehicle_type: v['vehicleType'],
                model_year: v['modelYear'],
                plate_number: v['plateNumber'],
                code_number: v['codeNumber'],
                color: v['color'],
                seats: v['seats'],
                is_verified: v['isVerified'],
            })),
            ratings_summary: {
                avg: Number(user['avgRating'] || 0),
                count: ratingCount,
            },
        },
    };
    (0, httpResponse_1.successResponse)(res, data);
});
exports.getProfile = getProfile;
exports.default = {
    getHome,
    getSubscription,
    getBookings,
    getBookingById,
    getRatings,
    getPenalties,
    getComplaints,
    getEarnings,
    getStats,
    getProfile,
    getFullProfile,
    getPersonalData,
    updatePersonalData,
    getAccountStatus,
    requestDeleteAccount,
    cancelDeleteAccount,
};
//# sourceMappingURL=driverController.js.map