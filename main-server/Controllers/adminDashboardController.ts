import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as adminDashboardService from '../Services/adminDashboardService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const getSummary = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (adminDashboardService as unknown as { getSummary: () => Promise<unknown> }).getSummary());
});

const getRecentTrips = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await (adminDashboardService as unknown as { getRecentTrips: (q: unknown) => Promise<unknown> }).getRecentTrips(req.query);
  successResponse(res, result);
});

const getTopRoutes = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (adminDashboardService as unknown as { getTopRoutes: () => Promise<unknown> }).getTopRoutes());
});

const getPendingRequests = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await (adminDashboardService as unknown as { getPendingRequests: (q: unknown) => Promise<unknown> }).getPendingRequests(req.query);
  successResponse(res, result);
});

const getLatestComplaints = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await (adminDashboardService as unknown as { getLatestComplaints: (q: unknown) => Promise<unknown> }).getLatestComplaints(req.query);
  successResponse(res, result);
});

const listDrivers = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await (adminDashboardService as unknown as { listDrivers: (q: unknown) => Promise<unknown> }).listDrivers(req.query);
  successResponse(res, result);
});

const getDriverStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (adminDashboardService as unknown as { getDriverStats: () => Promise<unknown> }).getDriverStats());
});

const getDriverHeader = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { driver_id } = req.params as { driver_id: string };
  successResponse(res, await (adminDashboardService as unknown as { getDriverHeader: (id: string) => Promise<unknown> }).getDriverHeader(driver_id));
});

const getDriverOverview = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { driver_id } = req.params as { driver_id: string };
  successResponse(res, await (adminDashboardService as unknown as { getDriverOverview: (id: string) => Promise<unknown> }).getDriverOverview(driver_id));
});

const listDriverTrips = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { driver_id } = req.params as { driver_id: string };
  const result = await (adminDashboardService as unknown as { listDriverTrips: (id: string, q: unknown) => Promise<unknown> }).listDriverTrips(driver_id, req.query);
  successResponse(res, result);
});

const getDriverEvaluations = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { driver_id } = req.params as { driver_id: string };
  const result = await (adminDashboardService as unknown as { getDriverEvaluations: (id: string, q: unknown) => Promise<unknown> }).getDriverEvaluations(driver_id, req.query);
  successResponse(res, result);
});

const getAccountLog = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { driver_id } = req.params as { driver_id: string };
  successResponse(res, await (adminDashboardService as unknown as { getAccountLog: (id: string) => Promise<unknown> }).getAccountLog(driver_id));
});

const getCarDetails = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { driver_id } = req.params as { driver_id: string };
  successResponse(res, await (adminDashboardService as unknown as { getCarDetails: (id: string) => Promise<unknown> }).getCarDetails(driver_id));
});

const getDocuments = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { driver_id } = req.params as { driver_id: string };
  successResponse(res, await (adminDashboardService as unknown as { getDocuments: (id: string) => Promise<unknown> }).getDocuments(driver_id));
});

const setDriverStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { driver_id } = req.params as { driver_id: string };
  const { status } = req.body as { status: string };
  const result = await (adminDashboardService as unknown as { setDriverStatus: (actorId: string, driverId: string, status: string) => Promise<unknown> }).setDriverStatus(String(authReq.user?.id), driver_id, status);
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: `dashboard.driver_status.${status}`,
    resourceType: 'driver',
    resourceId: driver_id,
    actorId: authReq.user?.id,
    payload: { status },
  });
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'driver', id: driver_id });
  successResponse(res, result);
});

const applyStandingAction = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { driver_id } = req.params as { driver_id: string };
  const { action, reason } = req.body as { action: string; reason?: string | null };
  const result = await (adminDashboardService as unknown as { applyStandingAction: (actorId: string, driverId: string, action: string, reason?: string | null) => Promise<unknown> }).applyStandingAction(String(authReq.user?.id), driver_id, action, reason);
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: `dashboard.account_action.${action}`,
    resourceType: 'driver',
    resourceId: driver_id,
    actorId: authReq.user?.id,
    payload: { action, reason: reason || null },
  });
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'driver', id: driver_id });
  successResponse(res, result);
});

const approveDocument = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { driver_id, document_key } = req.params as { driver_id: string; document_key: string };
  const result = await (adminDashboardService as unknown as { decideDocument: (actorId: string, driverId: string, key: string, decision: string, reason: string | null) => Promise<unknown> }).decideDocument(String(authReq.user?.id), driver_id, document_key, 'approved', null);
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: 'dashboard.document.approve',
    resourceType: 'document_review',
    resourceId: `${driver_id}:${document_key}`,
    actorId: authReq.user?.id,
    payload: { document_key },
  });
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'document_review', id: `${driver_id}:${document_key}` });
  successResponse(res, result);
});

const rejectDocument = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { driver_id, document_key } = req.params as { driver_id: string; document_key: string };
  const { reason } = req.body as { reason?: string };
  const result = await (adminDashboardService as unknown as { decideDocument: (actorId: string, driverId: string, key: string, decision: string, reason: string | undefined) => Promise<unknown> }).decideDocument(String(authReq.user?.id), driver_id, document_key, 'rejected', reason);
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: 'dashboard.document.reject',
    resourceType: 'document_review',
    resourceId: `${driver_id}:${document_key}`,
    actorId: authReq.user?.id,
    payload: { document_key, reason: reason || null },
  });
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'document_review', id: `${driver_id}:${document_key}` });
  successResponse(res, result);
});

const listReservations = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await (adminDashboardService as unknown as { listReservations: (q: unknown) => Promise<unknown> }).listReservations(req.query);
  successResponse(res, result);
});

export {
  getSummary,
  getRecentTrips,
  getTopRoutes,
  getPendingRequests,
  getLatestComplaints,
  listDrivers,
  getDriverStats,
  getDriverHeader,
  getDriverOverview,
  listDriverTrips,
  getDriverEvaluations,
  getAccountLog,
  getCarDetails,
  getDocuments,
  setDriverStatus,
  applyStandingAction,
  approveDocument,
  rejectDocument,
  listReservations,
};

export default {
  getSummary,
  getRecentTrips,
  getTopRoutes,
  getPendingRequests,
  getLatestComplaints,
  listDrivers,
  getDriverStats,
  getDriverHeader,
  getDriverOverview,
  listDriverTrips,
  getDriverEvaluations,
  getAccountLog,
  getCarDetails,
  getDocuments,
  setDriverStatus,
  applyStandingAction,
  approveDocument,
  rejectDocument,
  listReservations,
};
