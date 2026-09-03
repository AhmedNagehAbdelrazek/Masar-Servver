import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as rideRequestService from '../Services/rideRequestService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const createRideRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const rideRequest = await (rideRequestService as unknown as { createRideRequest: (userId: string, body: unknown) => Promise<{ id: string }> }).createRideRequest(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'ride_request', id: rideRequest.id, label: 'ride request created' });
  successResponse(res, { ride_request: rideRequest }, 201);
});

const listRequests = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (rideRequestService as unknown as { listRequests: (user: { id: string; role: string } | undefined, q: unknown) => Promise<unknown> }).listRequests(authReq.user as { id: string; role: string }, req.query);
  successResponse(res, result);
});

const getRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { request_id } = req.params as { request_id: string };
  const result = await (rideRequestService as unknown as { getRequest: (user: { id: string; role: string } | undefined, id: string) => Promise<unknown> }).getRequest(authReq.user as { id: string; role: string }, request_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'ride_request', id: request_id });
  successResponse(res, result);
});

const getMatches = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { request_id } = req.params as { request_id: string };
  const result = await (rideRequestService as unknown as { getMatches: (user: { id: string; role: string } | undefined, id: string) => Promise<unknown> }).getMatches(authReq.user as { id: string; role: string }, request_id);
  successResponse(res, result);
});

const updateRideRequest = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { request_id } = req.params as { request_id: string };
  const rideRequest = await (rideRequestService as unknown as { updateRideRequest: (userId: string, id: string, body: unknown) => Promise<{ id: string }> }).updateRideRequest(String(authReq.user?.id), request_id, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'ride_request', id: request_id });
  successResponse(res, { ride_request: rideRequest });
});

const submitOffer = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { request_id } = req.params as { request_id: string };
  const offer = await (rideRequestService as unknown as { submitOffer: (userId: string, id: string, body: unknown) => Promise<{ id: string }> }).submitOffer(String(authReq.user?.id), request_id, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'request_offer', id: offer.id, label: 'offer submitted' });
  successResponse(res, { offer }, 201);
});

const listOffers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { request_id } = req.params as { request_id: string };
  const result = await (rideRequestService as unknown as { listOffersForRequest: (userId: string, id: string) => Promise<unknown> }).listOffersForRequest(String(authReq.user?.id), request_id);
  successResponse(res, result);
});

const listMyOffers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (rideRequestService as unknown as { listDriverOffers: (userId: string, q: unknown) => Promise<unknown> }).listDriverOffers(String(authReq.user?.id), req.query);
  successResponse(res, result);
});

const decideOffer = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { offer_id } = req.params as { offer_id: string };
  const { action } = req.body as { action: string };
  const offer = await (rideRequestService as unknown as { decideOffer: (userId: string, offerId: string, action: string) => Promise<{ id: string }> }).decideOffer(String(authReq.user?.id), offer_id, action);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'request_offer', id: offer_id, label: `offer ${action}ed` });
  successResponse(res, { offer });
});

const agreePrice = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { offer_id } = req.params as { offer_id: string };
  const { agreed_fare } = req.body as { agreed_fare: number };
  const offer = await (rideRequestService as unknown as { agreeOfferPrice: (userId: string, offerId: string, fare: number) => Promise<{ id: string }> }).agreeOfferPrice(String(authReq.user?.id), offer_id, agreed_fare);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'request_offer', id: offer_id, label: 'price agreed' });
  successResponse(res, { offer });
});

export {
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
export default {
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
