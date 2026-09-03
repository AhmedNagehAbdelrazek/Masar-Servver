import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse, envelopeResponse } from '../utils/httpResponse';
import * as verificationService from '../Services/verificationService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const getQueue = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const result = await (verificationService as unknown as { getQueue: (q: unknown) => Promise<unknown> }).getQueue(req.query);
  envelopeResponse(res, result);
});

const approveDriver = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { driver_id } = req.params as { driver_id: string };
  const result = await (verificationService as unknown as { approveDriver: (actorId: string, driverId: string) => Promise<unknown> }).approveDriver(String(authReq.user?.id), driver_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'driver_profile', id: driver_id });
  successResponse(res, result);
});

const rejectDriver = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { driver_id } = req.params as { driver_id: string };
  const { reason, fields_to_fix } = req.body as { reason: string; fields_to_fix?: string[] };
  const result = await (verificationService as unknown as { rejectDriver: (actorId: string, driverId: string, reason: string, fields: string[] | undefined) => Promise<unknown> }).rejectDriver(String(authReq.user?.id), driver_id, reason, fields_to_fix);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'driver_profile', id: driver_id });
  successResponse(res, result);
});

const approveVehicle = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { vehicle_id } = req.params as { vehicle_id: string };
  const result = await (verificationService as unknown as { approveVehicle: (actorId: string, vehicleId: string) => Promise<unknown> }).approveVehicle(String(authReq.user?.id), vehicle_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'vehicle', id: vehicle_id });
  successResponse(res, result);
});

const rejectVehicle = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { vehicle_id } = req.params as { vehicle_id: string };
  const { reason, fields_to_fix } = req.body as { reason: string; fields_to_fix?: string[] };
  const result = await (verificationService as unknown as { rejectVehicle: (actorId: string, vehicleId: string, reason: string, fields: string[] | undefined) => Promise<unknown> }).rejectVehicle(String(authReq.user?.id), vehicle_id, reason, fields_to_fix);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'vehicle', id: vehicle_id });
  successResponse(res, result);
});

export { getQueue, approveDriver, rejectDriver, approveVehicle, rejectVehicle };
export default { getQueue, approveDriver, rejectDriver, approveVehicle, rejectVehicle };
