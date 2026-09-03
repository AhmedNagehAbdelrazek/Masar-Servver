"use strict";
const rideRequestService = require('../Services/rideRequestService');
const { successResponse } = require('../utils/httpResponse');
const catchAsync = require('../utils/catchAsync');
const { markResource } = require('../Services/auditService');
const createRideRequest = catchAsync(async (req, res) => {
    const ride_request = await rideRequestService.createRideRequest(req.user.id, req.body);
    markResource(res, { type: 'ride_request', id: ride_request.id, label: 'ride request created' });
    successResponse(res, { ride_request }, 201);
});
const listRequests = catchAsync(async (req, res) => {
    const result = await rideRequestService.listRequests(req.user, req.query);
    successResponse(res, result);
});
const getRequest = catchAsync(async (req, res) => {
    const result = await rideRequestService.getRequest(req.user, req.params.request_id);
    markResource(res, { type: 'ride_request', id: req.params.request_id });
    successResponse(res, result);
});
const getMatches = catchAsync(async (req, res) => {
    const result = await rideRequestService.getMatches(req.user, req.params.request_id);
    successResponse(res, result);
});
const updateRideRequest = catchAsync(async (req, res) => {
    const ride_request = await rideRequestService.updateRideRequest(req.user.id, req.params.request_id, req.body);
    markResource(res, { type: 'ride_request', id: req.params.request_id });
    successResponse(res, { ride_request });
});
const submitOffer = catchAsync(async (req, res) => {
    const offer = await rideRequestService.submitOffer(req.user.id, req.params.request_id, req.body);
    markResource(res, { type: 'request_offer', id: offer.id, label: 'offer submitted' });
    successResponse(res, { offer }, 201);
});
const listOffers = catchAsync(async (req, res) => {
    const result = await rideRequestService.listOffersForRequest(req.user.id, req.params.request_id);
    successResponse(res, result);
});
const listMyOffers = catchAsync(async (req, res) => {
    const result = await rideRequestService.listDriverOffers(req.user.id, req.query);
    successResponse(res, result);
});
const decideOffer = catchAsync(async (req, res) => {
    const offer = await rideRequestService.decideOffer(req.user.id, req.params.offer_id, req.body.action);
    markResource(res, { type: 'request_offer', id: req.params.offer_id, label: `offer ${req.body.action}ed` });
    successResponse(res, { offer });
});
const agreePrice = catchAsync(async (req, res) => {
    const offer = await rideRequestService.agreeOfferPrice(req.user.id, req.params.offer_id, req.body.agreed_fare);
    markResource(res, { type: 'request_offer', id: req.params.offer_id, label: 'price agreed' });
    successResponse(res, { offer });
});
module.exports = {
    createRideRequest,
    listRequests,
    getRequest,
    getMatches,
    updateRideRequest,
    submitOffer,
    listOffers,
    listMyOffers,
    decideOffer,
    agreePrice,
};
//# sourceMappingURL=rideRequestController.js.map