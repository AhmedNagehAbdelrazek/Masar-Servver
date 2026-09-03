import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as seatLockService from '../Services/seatLockService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const lockSeat = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id } = req.params as { trip_id: string };
  const { seat_number } = req.body as { seat_number: number };
  const result = await (seatLockService as unknown as { lockSeat: (tripId: string, seatNumber: number, userId: string) => Promise<unknown> }).lockSeat(trip_id, seat_number, String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'trip', id: trip_id, label: `seat ${seat_number}` });
  successResponse(res, result, 200);
});

const releaseSeat = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { trip_id, seat_number } = req.params as { trip_id: string; seat_number: string };
  const result = await (seatLockService as unknown as { releaseSeat: (tripId: string, seatNumber: number, userId: string) => Promise<unknown> }).releaseSeat(trip_id, parseInt(seat_number, 10), String(authReq.user?.id));
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'trip', id: trip_id, label: `seat ${seat_number}` });
  successResponse(res, result);
});

export { lockSeat, releaseSeat };
export default { lockSeat, releaseSeat };
