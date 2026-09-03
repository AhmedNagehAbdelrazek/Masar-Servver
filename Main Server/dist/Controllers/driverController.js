"use strict";
const bookingService = require('../Services/bookingService');
const ratingService = require('../Services/ratingService');
const penaltyService = require('../Services/penaltyService');
const complaintService = require('../Services/complaintService');
const earningsService = require('../Services/earningsService');
const statsService = require('../Services/statsService');
const homeService = require('../Services/homeService');
const driverProfileService = require('../Services/driverProfileService');
const personalDataService = require('../Services/personalDataService');
const deletionRequestService = require('../Services/deletionRequestService');
const { markResource } = require('../Services/auditService');
const { User, Rating, Vehicle, DriverProfile } = require('../Models');
const { successResponse } = require('../utils/httpResponse');
const { ApiErrors } = require('../utils/ApiError');
const { USER_STATUS } = require('../config/constants');
const { maskPhone, maskNationalId } = require('../utils/masking');
const catchAsync = require('../utils/catchAsync');
/**
 * Home/subscription gate: the driver must be verified and not suspended/banned
 * (`warned` and `active` pass). Middleware already guarantees the driver role.
 */
async function assertDriverEligible(userId) {
    const user = await User.findByPk(userId);
    if (!user)
        throw ApiErrors.notFound('USER_NOT_FOUND');
    if (user.isVerified !== true || [USER_STATUS.SUSPENDED, USER_STATUS.BANNED].includes(user.status)) {
        throw ApiErrors.forbidden('ACCOUNT_MUST_BE_VERIFIED_AND_ACTIVE_TO_ACCESS_THIS_RESOURCE');
    }
    return user;
}
const getHome = catchAsync(async (req, res) => {
    await assertDriverEligible(req.user.id);
    const result = await homeService.getHome(req.user.id);
    successResponse(res, result);
});
const getSubscription = catchAsync(async (req, res) => {
    await assertDriverEligible(req.user.id);
    const result = await homeService.getSubscription(req.user.id);
    successResponse(res, result);
});
const getBookings = catchAsync(async (req, res) => {
    const result = await bookingService.listForDriver(req.user.id, req.query);
    successResponse(res, result);
});
const getBookingById = catchAsync(async (req, res) => {
    const result = await bookingService.getForDriver(req.user.id, req.params.booking_id);
    successResponse(res, result);
});
const getRatings = catchAsync(async (req, res) => {
    const result = await ratingService.listWithDistribution(req.user.id, req.query);
    successResponse(res, result);
});
// ===== Profile & settings screens (spec 010) =====
const getFullProfile = catchAsync(async (req, res) => {
    const result = await driverProfileService.getFullProfile(req.user.id);
    successResponse(res, result);
});
const getPersonalData = catchAsync(async (req, res) => {
    const result = await personalDataService.buildPersonalDataView(req.user.id);
    successResponse(res, result);
});
const updatePersonalData = catchAsync(async (req, res) => {
    const result = await personalDataService.updatePersonalData(req.user.id, req.body);
    markResource(res, { type: 'user', id: req.user.id });
    successResponse(res, result);
});
const getAccountStatus = catchAsync(async (req, res) => {
    const result = await driverProfileService.getAccountStatus(req.user.id);
    successResponse(res, result);
});
const requestDeleteAccount = catchAsync(async (req, res) => {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason : null;
    const confirmation = req.body?.confirmation === true;
    const result = await deletionRequestService.requestDeletion(req.user.id, { reason, confirmation });
    successResponse(res, result);
});
const cancelDeleteAccount = catchAsync(async (req, res) => {
    const result = await deletionRequestService.cancelDeletionRequest(req.user.id);
    successResponse(res, result);
});
const getPenalties = catchAsync(async (req, res) => {
    const result = await penaltyService.listForDriver(req.user.id, req.query);
    successResponse(res, result);
});
const getComplaints = catchAsync(async (req, res) => {
    const result = await complaintService.listForDriver(req.user.id, req.query);
    successResponse(res, result);
});
const getEarnings = catchAsync(async (req, res) => {
    const result = await earningsService.aggregate(req.user.id, req.query);
    successResponse(res, result);
});
const getStats = catchAsync(async (req, res) => {
    const result = await statsService.lifetime(req.user.id);
    successResponse(res, result);
});
const getProfile = catchAsync(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        include: [
            {
                model: DriverProfile,
                as: 'driverProfile',
            },
        ],
    });
    const ratingCount = await Rating.count({ where: { ratee_id: req.user.id } });
    const profile = user.driverProfile || {};
    const vehicles = await Vehicle.findAll({ where: { driver_id: req.user.id } });
    const anyVerified = vehicles.some((v) => v.isVerified);
    const identityVerified = Boolean(profile.idVerified);
    const vehicleVerified = anyVerified;
    const data = {
        profile: {
            user: {
                id: user.id,
                full_name: user.fullName,
                phone: maskPhone(user.phone),
                role: user.role,
                status: user.status,
                avg_rating: Number(user.avgRating || 0),
            },
            driver: {
                id_verified: Boolean(profile.idVerified),
                license_expiry: profile.licenseExpiry || null,
                total_trips: profile.totalTrips || 0,
                total_earnings: Number(profile.totalEarnings || 0),
                response_rate: Number(profile.responseRate || 0),
                national_id: maskNationalId(profile.nationalID),
            },
            verification: {
                identity_verified: identityVerified,
                vehicle_verified: vehicleVerified,
                fully_verified: identityVerified && vehicleVerified,
            },
            vehicles: vehicles.map((v) => ({
                id: v.id,
                manufacturer: v.manufacturer,
                model: v.model,
                vehicle_type: v.vehicleType,
                model_year: v.modelYear,
                plate_number: v.plateNumber,
                code_number: v.codeNumber,
                color: v.color,
                seats: v.seats,
                is_verified: v.isVerified,
            })),
            ratings_summary: {
                avg: Number(user.avgRating || 0),
                count: ratingCount,
            },
        },
    };
    successResponse(res, data);
});
module.exports = {
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