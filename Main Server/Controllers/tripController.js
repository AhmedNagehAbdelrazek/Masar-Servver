const tripService = require('../Services/tripService');
const rideRequestService = require('../Services/rideRequestService');
const { successResponse } = require('../utils/httpResponse');
const catchAsync = require('../utils/catchAsync');
const { markResource } = require('../Services/auditService');
const { ApiErrors } = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

const createTrip = catchAsync(async (req, res) => {
  const result = await tripService.createTrip(req.user.id, req.body);
  markResource(res, { type: 'trip', id: result.trip_id });
  successResponse(res, result, 201);
});

const getTripById = catchAsync(async (req, res) => {
  const trip = await tripService.getTripById(req.params.trip_id);
  const participantIds = trip._participantIds || [];
  const isAdmin = req.user.role === ROLES.ADMIN;
  const isParticipant = isAdmin || participantIds.includes(req.user.id);
  delete trip._participantIds;
  if (!isParticipant) {
    throw ApiErrors.forbidden('YOU_DO_NOT_HAVE_ACCESS_TO_THIS_TRIP');
  }
  successResponse(res, trip);
});

const getDriverTrips = catchAsync(async (req, res) => {
  const { status } = req.query;
  const trips = await tripService.getDriverTrips(req.user.id, status);
  successResponse(res, { trips });
});

const getAvailableTrips = catchAsync(async (req, res) => {
  const {
    origin_city,
    destination_city,
    date,
    gender_preference,
    time_from,
    time_to,
    vehicle_type,
    seats,
  } = req.query;
  const trips = await tripService.getAvailableTrips({
    originCity: origin_city,
    destinationCity: destination_city,
    date: date || new Date().toISOString().split('T')[0],
    genderPreference: gender_preference,
    timeFrom: time_from,
    timeTo: time_to,
    vehicleType: vehicle_type,
    seats,
  });

  // Record the search route for the passenger home "last searched trips"
  // section (best-effort; never blocks the search response).
  if (req.user && req.user.role === ROLES.PASSENGER && origin_city && destination_city) {
    try {
      const recentSearchService = require('../Services/recentSearchService');
      await recentSearchService.recordSearch(req.user.id, origin_city, destination_city);
    } catch (err) {
      console.warn('[tripController] record search failed:', err.message);
    }
  }

  successResponse(res, { trips });
});

const startTrip = catchAsync(async (req, res) => {
  const result = await tripService.startTrip(req.user.id, req.params.trip_id);
  markResource(res, { type: 'trip', id: result.trip_id });
  successResponse(res, result);
});

const completeTrip = catchAsync(async (req, res) => {
  const result = await tripService.completeTrip(req.user.id, req.params.trip_id);
  markResource(res, { type: 'trip', id: result.trip_id });
  successResponse(res, result);
});

const updateTrip = catchAsync(async (req, res) => {
  const result = await tripService.updateTrip(req.user.id, req.params.trip_id, req.body);
  markResource(res, { type: 'trip', id: result.trip.id });
  successResponse(res, result);
});

const cancelTrip = catchAsync(async (req, res) => {
  const result = await tripService.cancelTrip(req.user.id, req.params.trip_id);
  markResource(res, { type: 'trip', id: result.trip.id });
  successResponse(res, result);
});

const getTripAttributes = catchAsync(async (req, res) => {
  const result = await tripService.getTripAttributes(req.params.trip_id);
  successResponse(res, result);
});

const getTripOptions = catchAsync(async (req, res) => {
  const result = await tripService.getTripOptions(req.params.trip_id);
  successResponse(res, result);
});

const getTripPassengers = catchAsync(async (req, res) => {
  const { status } = req.query;
  const result = await tripService.getTripPassengers(req.user.id, req.params.trip_id, { status });
  successResponse(res, result);
});

const cancelTripWithPenalty = catchAsync(async (req, res) => {
  const result = await tripService.cancelTripWithPenalty(req.user.id, req.params.trip_id, req.body);
  markResource(res, { type: 'trip', id: result.trip_id });
  successResponse(res, result, 200);
});

const attachOfferToTrip = catchAsync(async (req, res) => {
  const result = await rideRequestService.attachOfferToTrip(req.user.id, req.params.trip_id, req.params.offer_id, req.body);
  markResource(res, { type: 'booking', id: result.booking.id, label: `booking ${result.booking.reference_code}` });
  successResponse(res, result, 201);
});

module.exports = {
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
