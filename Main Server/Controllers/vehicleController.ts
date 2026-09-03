import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as vehicleService from '../Services/vehicleService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const listVehicles = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (vehicleService as unknown as { listByDriver: (id: string) => Promise<unknown> }).listByDriver(String(authReq.user?.id));
  successResponse(res, result);
});

const updateVehicle = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { vehicle_id } = req.params as { vehicle_id: string };
  const result = await (vehicleService as unknown as { update: (userId: string, vehicleId: string, body: unknown) => Promise<{ vehicle: { id: string; plate_number: string } }> }).update(String(authReq.user?.id), vehicle_id, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'vehicle', id: result.vehicle.id, label: result.vehicle.plate_number });
  successResponse(res, result);
});

export { listVehicles, updateVehicle };
export default { listVehicles, updateVehicle };
