const tripService = require('../Services/tripService');
const rideRequestService = require('../Services/rideRequestService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const { ApiErrors } = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

const createTrip = async (req, res, next) => {
  try {
    const result = await tripService.createTrip(req.user.id, req.body);
    markResource(res, { type: 'trip', id: result.trip_id });
    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.trip_id);
    const participantIds = trip._participantIds || [];
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isParticipant = isAdmin || participantIds.includes(req.user.id);
    delete trip._participantIds;
    if (!isParticipant) {
      throw ApiErrors.forbidden('You do not have access to this trip');
    }
    successResponse(res, trip);
  } catch (err) {
    next(err);
  }
};

const getDriverTrips = async (req, res, next) => {
  try {
    const { status } = req.query;
    const trips = await tripService.getDriverTrips(req.user.id, status);
    successResponse(res, { trips });
  } catch (err) {
    next(err);
  }
};

const getAvailableTrips = async (req, res, next) => {
  try {
    const { origin_city, destination_city, date, gender_preference } = req.query;
    const trips = await tripService.getAvailableTrips(
      origin_city,
      destination_city,
      date || new Date().toISOString().split('T')[0],
      gender_preference
    );
    successResponse(res, { trips });
  } catch (err) {
    next(err);
  }
};

const startTrip = async (req, res, next) => {
  try {
    const result = await tripService.startTrip(req.user.id, req.params.trip_id);
    markResource(res, { type: 'trip', id: result.trip_id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const completeTrip = async (req, res, next) => {
  try {
    const result = await tripService.completeTrip(req.user.id, req.params.trip_id);
    markResource(res, { type: 'trip', id: result.trip_id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const updateTrip = async (req, res, next) => {
  try {
    const result = await tripService.updateTrip(req.user.id, req.params.trip_id, req.body);
    markResource(res, { type: 'trip', id: result.trip.id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const cancelTrip = async (req, res, next) => {
  try {
    const result = await tripService.cancelTrip(req.user.id, req.params.trip_id);
    markResource(res, { type: 'trip', id: result.trip.id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getTripAttributes = async (req, res, next) => {
  try {
    const result = await tripService.getTripAttributes(req.params.trip_id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const cancelTripWithPenalty = async (req, res, next) => {
  try {
    const result = await tripService.cancelTripWithPenalty(req.user.id, req.params.trip_id, req.body);
    markResource(res, { type: 'trip', id: result.trip_id });
    successResponse(res, result, 200);
  } catch (err) {
    next(err);
  }
};

const attachOfferToTrip = async (req, res, next) => {
  try {
    const result = await rideRequestService.attachOfferToTrip(req.user.id, req.params.trip_id, req.params.offer_id, req.body);
    markResource(res, { type: 'booking', id: result.booking.id, label: `booking ${result.booking.reference_code}` });
    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

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
  attachOfferToTrip,
};
