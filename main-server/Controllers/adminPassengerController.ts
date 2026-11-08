import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as service from '../Services/adminPassengerService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const getStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (service as unknown as { getStats: () => Promise<unknown> }).getStats());
});

const listPassengers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (service as unknown as { listPassengers: (q: unknown) => Promise<unknown> }).listPassengers(req.query));
});

const exportPassengers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const csv = await (service as unknown as { exportPassengers: (q: unknown) => Promise<string> }).exportPassengers(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="passengers.csv"');
  res.status(200).send(csv);
});

const getOverview = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { passenger_id } = req.params as { passenger_id: string };
  successResponse(res, await (service as unknown as { getOverview: (id: string) => Promise<unknown> }).getOverview(passenger_id));
});

const getAccountLog = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { passenger_id } = req.params as { passenger_id: string };
  successResponse(res, await (service as unknown as { getAccountLog: (id: string) => Promise<unknown> }).getAccountLog(passenger_id));
});

const listBookings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { passenger_id } = req.params as { passenger_id: string };
  successResponse(res, await (service as unknown as { listBookings: (id: string, q: unknown) => Promise<unknown> }).listBookings(passenger_id, req.query));
});

const listTripRequests = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { passenger_id } = req.params as { passenger_id: string };
  successResponse(res, await (service as unknown as { listTripRequests: (id: string, q: unknown) => Promise<unknown> }).listTripRequests(passenger_id, req.query));
});

const listComplaints = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { passenger_id } = req.params as { passenger_id: string };
  successResponse(res, await (service as unknown as { listComplaints: (id: string, q: unknown) => Promise<unknown> }).listComplaints(passenger_id, req.query));
});

const listRatings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { passenger_id } = req.params as { passenger_id: string };
  successResponse(res, await (service as unknown as { listRatings: (id: string, q: unknown) => Promise<unknown> }).listRatings(passenger_id, req.query));
});

const sendNotification = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { passenger_id } = req.params as { passenger_id: string };
  const result = await (service as unknown as { sendNotification: (a: string, id: string, dto: unknown) => Promise<unknown> }).sendNotification(String(authReq.user?.id), passenger_id, req.body);
  (auditService as unknown as { track: (p: unknown) => void }).track({ action: 'passenger.notify', resourceType: 'user', resourceId: passenger_id, actorId: authReq.user?.id, payload: { category: (req.body as { type?: string }).type || 'general' } });
  successResponse(res, result);
});

const sendWarning = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { passenger_id } = req.params as { passenger_id: string };
  const result = await (service as unknown as { sendWarning: (a: string, id: string, dto: unknown) => Promise<unknown> }).sendWarning(String(authReq.user?.id), passenger_id, req.body);
  (auditService as unknown as { track: (p: unknown) => void }).track({ action: 'passenger.warning', resourceType: 'user', resourceId: passenger_id, actorId: authReq.user?.id, payload: req.body });
  successResponse(res, result);
});

const suspendTemporary = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { passenger_id } = req.params as { passenger_id: string };
  const result = await (service as unknown as { suspendTemporary: (a: string, id: string, dto: unknown) => Promise<unknown> }).suspendTemporary(String(authReq.user?.id), passenger_id, req.body);
  successResponse(res, result);
});

const suspendPermanent = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { passenger_id } = req.params as { passenger_id: string };
  const result = await (service as unknown as { suspendPermanent: (a: string, id: string, dto: unknown) => Promise<unknown> }).suspendPermanent(String(authReq.user?.id), passenger_id, req.body);
  successResponse(res, result);
});

const applyAccountStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { passenger_id } = req.params as { passenger_id: string };
  const { action } = req.body as { action: string };
  const result = await (service as unknown as { applyAccountStatus: (a: string, id: string, action: string) => Promise<unknown> }).applyAccountStatus(String(authReq.user?.id), passenger_id, action);
  (auditService as unknown as { track: (p: unknown) => void }).track({ action: `passenger.account.${action}`, resourceType: 'user', resourceId: passenger_id, actorId: authReq.user?.id, payload: { action } });
  successResponse(res, result);
});

export {
  getStats,
  listPassengers,
  exportPassengers,
  getOverview,
  getAccountLog,
  listBookings,
  listTripRequests,
  listComplaints,
  listRatings,
  sendNotification,
  sendWarning,
  suspendTemporary,
  suspendPermanent,
  applyAccountStatus,
};
export default {
  getStats,
  listPassengers,
  exportPassengers,
  getOverview,
  getAccountLog,
  listBookings,
  listTripRequests,
  listComplaints,
  listRatings,
  sendNotification,
  sendWarning,
  suspendTemporary,
  suspendPermanent,
  applyAccountStatus,
};
