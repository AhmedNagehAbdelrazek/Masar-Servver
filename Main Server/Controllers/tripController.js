const tripService = require('../Services/tripService');
const { successResponse } = require('../utils/httpResponse');

const createTrip = async (req, res, next) => {
  try {
    const result = await tripService.createTrip(req.user.id, req.body);
    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.trip_id);
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
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const completeTrip = async (req, res, next) => {
  try {
    const result = await tripService.completeTrip(req.user.id, req.params.trip_id);
    successResponse(res, result);
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
};
