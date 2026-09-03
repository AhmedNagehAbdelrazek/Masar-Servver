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
exports.attachOfferToTrip = exports.getTripPassengers = exports.getTripOptions = exports.getTripAttributes = exports.cancelTripWithPenalty = exports.cancelTrip = exports.updateTrip = exports.completeTrip = exports.startTrip = exports.getAvailableTrips = exports.getDriverTrips = exports.getTripById = exports.createTrip = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const ApiError_1 = require("../utils/ApiError");
const constants_1 = require("../config/constants");
const tripService = __importStar(require("../Services/tripService"));
const rideRequestService = __importStar(require("../Services/rideRequestService"));
const recentSearchService = __importStar(require("../Services/recentSearchService"));
const auditService = __importStar(require("../Services/auditService"));
const createTrip = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await tripService.createTrip(String(authReq.user?.id), req.body);
    auditService.markResource(res, { type: 'trip', id: result.trip_id });
    (0, httpResponse_1.successResponse)(res, result, 201);
});
exports.createTrip = createTrip;
const getTripById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { trip_id } = req.params;
    const trip = await tripService.getTripById(trip_id);
    const participantIds = trip['_participantIds'] || [];
    const isAdmin = authReq.user?.role === constants_1.ROLES.ADMIN;
    const isParticipant = isAdmin || participantIds.includes(String(authReq.user?.id));
    delete trip['_participantIds'];
    if (!isParticipant) {
        throw ApiError_1.ApiErrors.forbidden('YOU_DO_NOT_HAVE_ACCESS_TO_THIS_TRIP');
    }
    (0, httpResponse_1.successResponse)(res, trip);
});
exports.getTripById = getTripById;
const getDriverTrips = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { status } = req.query;
    const trips = await tripService.getDriverTrips(String(authReq.user?.id), status);
    (0, httpResponse_1.successResponse)(res, { trips });
});
exports.getDriverTrips = getDriverTrips;
const getAvailableTrips = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { origin_city, destination_city, date, gender_preference, time_from, time_to, vehicle_type, seats } = req.query;
    const trips = await tripService.getAvailableTrips({
        originCity: origin_city,
        destinationCity: destination_city,
        date,
        genderPreference: gender_preference,
        timeFrom: time_from,
        timeTo: time_to,
        vehicleType: vehicle_type,
        seats,
    });
    if (authReq.user && authReq.user.role === constants_1.ROLES.PASSENGER && origin_city && destination_city) {
        try {
            await recentSearchService.recordSearch(String(authReq.user.id), origin_city, destination_city);
        }
        catch (err) {
            console.warn('[tripController] record search failed:', err.message);
        }
    }
    (0, httpResponse_1.successResponse)(res, { trips });
});
exports.getAvailableTrips = getAvailableTrips;
const startTrip = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { trip_id } = req.params;
    const result = await tripService.startTrip(String(authReq.user?.id), trip_id);
    auditService.markResource(res, { type: 'trip', id: result.trip_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.startTrip = startTrip;
const completeTrip = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { trip_id } = req.params;
    const result = await tripService.completeTrip(String(authReq.user?.id), trip_id);
    auditService.markResource(res, { type: 'trip', id: result.trip_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.completeTrip = completeTrip;
const updateTrip = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { trip_id } = req.params;
    const result = await tripService.updateTrip(String(authReq.user?.id), trip_id, req.body);
    auditService.markResource(res, { type: 'trip', id: result.trip.id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.updateTrip = updateTrip;
const cancelTrip = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { trip_id } = req.params;
    const result = await tripService.cancelTrip(String(authReq.user?.id), trip_id);
    auditService.markResource(res, { type: 'trip', id: result.trip.id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.cancelTrip = cancelTrip;
const getTripAttributes = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { trip_id } = req.params;
    const result = await tripService.getTripAttributes(trip_id);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getTripAttributes = getTripAttributes;
const getTripOptions = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { trip_id } = req.params;
    const result = await tripService.getTripOptions(trip_id);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getTripOptions = getTripOptions;
const getTripPassengers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { trip_id } = req.params;
    const { status } = req.query;
    const result = await tripService.getTripPassengers(String(authReq.user?.id), trip_id, { status });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getTripPassengers = getTripPassengers;
const cancelTripWithPenalty = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { trip_id } = req.params;
    const result = await tripService.cancelTripWithPenalty(String(authReq.user?.id), trip_id, req.body);
    auditService.markResource(res, { type: 'trip', id: result.trip_id });
    (0, httpResponse_1.successResponse)(res, result, 200);
});
exports.cancelTripWithPenalty = cancelTripWithPenalty;
const attachOfferToTrip = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { trip_id, offer_id } = req.params;
    const result = await rideRequestService.attachOfferToTrip(String(authReq.user?.id), trip_id, offer_id, req.body);
    auditService.markResource(res, { type: 'booking', id: result.booking.id, label: `booking ${result.booking.reference_code}` });
    (0, httpResponse_1.successResponse)(res, result, 201);
});
exports.attachOfferToTrip = attachOfferToTrip;
exports.default = {
    createTrip,
    getTripById,
    getDriverTrips,
    getAvailableTrips,
    startTrip,
    completeTrip,
    updateTrip,
    cancelTrip,
    cancelTripWithPenalty,
    getTripAttributes,
    getTripOptions,
    getTripPassengers,
    attachOfferToTrip,
};
//# sourceMappingURL=tripController.js.map