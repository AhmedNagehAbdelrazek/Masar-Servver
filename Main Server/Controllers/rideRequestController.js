const rideRequestService = require('../Services/rideRequestService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');

const createRideRequest = async (req, res, next) => {
  try {
    const ride_request = await rideRequestService.createRideRequest(req.user.id, req.body);
    markResource(res, { type: 'ride_request', id: ride_request.id, label: 'ride request created' });
    successResponse(res, { ride_request }, 201);
  } catch (err) {
    next(err);
  }
};

const listRequests = async (req, res, next) => {
  try {
    const result = await rideRequestService.listRequests(req.user, req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getRequest = async (req, res, next) => {
  try {
    const result = await rideRequestService.getRequest(req.user, req.params.request_id);
    markResource(res, { type: 'ride_request', id: req.params.request_id });
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const updateRideRequest = async (req, res, next) => {
  try {
    const ride_request = await rideRequestService.updateRideRequest(req.user.id, req.params.request_id, req.body);
    markResource(res, { type: 'ride_request', id: req.params.request_id });
    successResponse(res, { ride_request });
  } catch (err) {
    next(err);
  }
};

const submitOffer = async (req, res, next) => {
  try {
    const offer = await rideRequestService.submitOffer(req.user.id, req.params.request_id, req.body);
    markResource(res, { type: 'request_offer', id: offer.id, label: 'offer submitted' });
    successResponse(res, { offer }, 201);
  } catch (err) {
    next(err);
  }
};

const listOffers = async (req, res, next) => {
  try {
    const result = await rideRequestService.listOffersForRequest(req.user.id, req.params.request_id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const listMyOffers = async (req, res, next) => {
  try {
    const result = await rideRequestService.listDriverOffers(req.user.id, req.query);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const decideOffer = async (req, res, next) => {
  try {
    const offer = await rideRequestService.decideOffer(req.user.id, req.params.offer_id, req.body.action);
    markResource(res, { type: 'request_offer', id: req.params.offer_id, label: `offer ${req.body.action}ed` });
    successResponse(res, { offer });
  } catch (err) {
    next(err);
  }
};

const agreePrice = async (req, res, next) => {
  try {
    const offer = await rideRequestService.agreeOfferPrice(req.user.id, req.params.offer_id, req.body.agreed_fare);
    markResource(res, { type: 'request_offer', id: req.params.offer_id, label: 'price agreed' });
    successResponse(res, { offer });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRideRequest,
  listRequests,
  getRequest,
  updateRideRequest,
  submitOffer,
  listOffers,
  listMyOffers,
  decideOffer,
  agreePrice,
};
