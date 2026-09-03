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
exports.agreePrice = exports.decideOffer = exports.listMyOffers = exports.listOffers = exports.submitOffer = exports.updateRideRequest = exports.getMatches = exports.getRequest = exports.listRequests = exports.createRideRequest = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const rideRequestService = __importStar(require("../Services/rideRequestService"));
const auditService = __importStar(require("../Services/auditService"));
const createRideRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const rideRequest = await rideRequestService.createRideRequest(String(authReq.user?.id), req.body);
    auditService.markResource(res, { type: 'ride_request', id: rideRequest.id, label: 'ride request created' });
    (0, httpResponse_1.successResponse)(res, { ride_request: rideRequest }, 201);
});
exports.createRideRequest = createRideRequest;
const listRequests = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await rideRequestService.listRequests(authReq.user, req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listRequests = listRequests;
const getRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { request_id } = req.params;
    const result = await rideRequestService.getRequest(authReq.user, request_id);
    auditService.markResource(res, { type: 'ride_request', id: request_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getRequest = getRequest;
const getMatches = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { request_id } = req.params;
    const result = await rideRequestService.getMatches(authReq.user, request_id);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getMatches = getMatches;
const updateRideRequest = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { request_id } = req.params;
    const rideRequest = await rideRequestService.updateRideRequest(String(authReq.user?.id), request_id, req.body);
    auditService.markResource(res, { type: 'ride_request', id: request_id });
    (0, httpResponse_1.successResponse)(res, { ride_request: rideRequest });
});
exports.updateRideRequest = updateRideRequest;
const submitOffer = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { request_id } = req.params;
    const offer = await rideRequestService.submitOffer(String(authReq.user?.id), request_id, req.body);
    auditService.markResource(res, { type: 'request_offer', id: offer.id, label: 'offer submitted' });
    (0, httpResponse_1.successResponse)(res, { offer }, 201);
});
exports.submitOffer = submitOffer;
const listOffers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { request_id } = req.params;
    const result = await rideRequestService.listOffersForRequest(String(authReq.user?.id), request_id);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listOffers = listOffers;
const listMyOffers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await rideRequestService.listDriverOffers(String(authReq.user?.id), req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listMyOffers = listMyOffers;
const decideOffer = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { offer_id } = req.params;
    const { action } = req.body;
    const offer = await rideRequestService.decideOffer(String(authReq.user?.id), offer_id, action);
    auditService.markResource(res, { type: 'request_offer', id: offer_id, label: `offer ${action}ed` });
    (0, httpResponse_1.successResponse)(res, { offer });
});
exports.decideOffer = decideOffer;
const agreePrice = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { offer_id } = req.params;
    const { agreed_fare } = req.body;
    const offer = await rideRequestService.agreeOfferPrice(String(authReq.user?.id), offer_id, agreed_fare);
    auditService.markResource(res, { type: 'request_offer', id: offer_id, label: 'price agreed' });
    (0, httpResponse_1.successResponse)(res, { offer });
});
exports.agreePrice = agreePrice;
exports.default = {
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