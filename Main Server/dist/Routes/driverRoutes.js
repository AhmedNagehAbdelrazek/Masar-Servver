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
const c = __importStar(require("../Controllers/driverController"));
const protect_1 = __importDefault(require("../middlewares/protect"));
const roleGuard_1 = require("../middlewares/roleGuard");
const validatorMiddleware_1 = __importDefault(require("../middlewares/validatorMiddleware"));
const bookingValidator_1 = require("../utils/validators/bookingValidator");
const ratingValidator_1 = require("../utils/validators/ratingValidator");
const penaltyValidator_1 = require("../utils/validators/penaltyValidator");
const complaintValidator_1 = require("../utils/validators/complaintValidator");
const earningsStatsValidator_1 = require("../utils/validators/earningsStatsValidator");
const profileValidator_1 = require("../utils/validators/profileValidator");
const rideRequestController = __importStar(require("../Controllers/rideRequestController"));
const rideRequestValidator_1 = require("../utils/validators/rideRequestValidator");
// Driver bookings (driver only)
router.get('/bookings', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...bookingValidator_1.bookingListValidation, validatorMiddleware_1.default, c.getBookings);
router.get('/bookings/:booking_id', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...bookingValidator_1.bookingParamValidation, validatorMiddleware_1.default, c.getBookingById);
// Ride-request offers sent by this driver
router.get('/offers', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...rideRequestValidator_1.driverOffersListValidation, validatorMiddleware_1.default, rideRequestController.listMyOffers);
// Ratings received (driver only)
router.get('/ratings', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...ratingValidator_1.ratingListValidation, validatorMiddleware_1.default, c.getRatings);
// Penalties (driver only)
router.get('/penalties', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...penaltyValidator_1.penaltyListValidation, validatorMiddleware_1.default, c.getPenalties);
// Complaints (driver only)
router.get('/complaints', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...complaintValidator_1.driverComplaintListValidation, validatorMiddleware_1.default, c.getComplaints);
// Earnings & stats (driver only)
router.get('/earnings', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...earningsStatsValidator_1.earningsQueryValidation, validatorMiddleware_1.default, c.getEarnings);
router.get('/stats', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.getStats);
// Aggregated profile (driver only)
router.get('/profile', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.getProfile);
// Profile & settings screens (spec 010, driver only)
router.get('/profile/full', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.getFullProfile);
router.get('/personal-data', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.getPersonalData);
router.put('/personal-data', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...profileValidator_1.updateDriverPersonalDataValidation, validatorMiddleware_1.default, c.updatePersonalData);
router.get('/account-status', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.getAccountStatus);
router.post('/delete-account', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.requestDeleteAccount);
router.post('/delete-account/cancel', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.cancelDeleteAccount);
// Driver home screen (driver, verified, active) + subscription details
router.get('/home', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.getHome);
router.get('/subscription', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.getSubscription);
exports.default = router;
module.exports = router;
//# sourceMappingURL=driverRoutes.js.map