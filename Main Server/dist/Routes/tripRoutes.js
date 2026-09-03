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
const c = __importStar(require("../Controllers/tripController"));
const protect_1 = __importDefault(require("../middlewares/protect"));
const roleGuard_1 = require("../middlewares/roleGuard");
const validatorMiddleware_1 = __importDefault(require("../middlewares/validatorMiddleware"));
const tripValidator_1 = require("../utils/validators/tripValidator");
const express_validator_1 = require("express-validator");
// Create trip (driver only)
router.post('/', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...tripValidator_1.createTripValidation, validatorMiddleware_1.default, c.createTrip);
// Get driver's trips
router.get('/driver/my-trips', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.getDriverTrips);
// Search available trips (passengers)
router.get('/search/available', protect_1.default, ...tripValidator_1.searchAvailableTripsValidation, validatorMiddleware_1.default, c.getAvailableTrips);
// Get trip by ID
router.get('/:trip_id', protect_1.default, ...tripValidator_1.tripParamValidation, validatorMiddleware_1.default, c.getTripById);
// Booking options for a trip: open seats + drop-off points (any authenticated user)
router.get('/:trip_id/options', protect_1.default, ...tripValidator_1.tripParamValidation, validatorMiddleware_1.default, c.getTripOptions);
// Start a trip (driver only)
router.post('/:trip_id/start', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.startTrip);
// Complete a trip (driver only)
router.post('/:trip_id/complete', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), c.completeTrip);
// Edit a trip (driver owner only)
router.put('/:trip_id', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...tripValidator_1.updateTripValidation, validatorMiddleware_1.default, c.updateTrip);
// Cancel a trip with penalty (driver owner only)
router.post('/:trip_id/cancel', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...tripValidator_1.cancelTripValidation, validatorMiddleware_1.default, c.cancelTripWithPenalty);
// Cancel a trip (driver owner only)
router.delete('/:trip_id', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...tripValidator_1.tripParamValidation, validatorMiddleware_1.default, c.cancelTrip);
// Trip attributes (any authenticated user)
router.get('/:trip_id/attributes', protect_1.default, ...tripValidator_1.tripParamValidation, validatorMiddleware_1.default, c.getTripAttributes);
// Trip passengers for dropdown selection (driver owner only)
router.get('/:trip_id/passengers', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...tripValidator_1.tripPassengersValidation, validatorMiddleware_1.default, c.getTripPassengers);
// Attach an accepted ride-request offer to this trip (driver owner only, deferred materialization)
const attachOfferValidation = [
    ...tripValidator_1.tripParamValidation,
    (0, express_validator_1.param)('offer_id').isUUID().withMessage('Offer ID must be a valid UUID'),
];
router.post('/:trip_id/offers/:offer_id/attach', protect_1.default, (0, roleGuard_1.roleGuard)(['driver']), ...attachOfferValidation, validatorMiddleware_1.default, c.attachOfferToTrip);
exports.default = router;
module.exports = router;
//# sourceMappingURL=tripRoutes.js.map