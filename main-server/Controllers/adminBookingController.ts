import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as service from '../Services/adminBookingService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const getStats = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (service as unknown as { getStats: () => Promise<unknown> }).getStats());
});

const listBookings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  successResponse(res, await (service as unknown as { listBookings: (q: unknown) => Promise<unknown> }).listBookings(req.query));
});

const getDetail = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { booking_id } = req.params as { booking_id: string };
  successResponse(res, await (service as unknown as { getDetail: (id: string) => Promise<unknown> }).getDetail(booking_id));
});

const cancelBooking = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { booking_id } = req.params as { booking_id: string };
  const result = await (service as unknown as { cancelBooking: (a: string, id: string, dto: unknown) => Promise<unknown> }).cancelBooking(String(authReq.user?.id), booking_id, req.body);
  (auditService as unknown as { track: (p: unknown) => void }).track({
    action: 'admin.booking.cancel',
    resourceType: 'booking',
    resourceId: booking_id,
    actorId: authReq.user?.id,
    payload: req.body,
  });
  successResponse(res, result);
});

export { getStats, listBookings, getDetail, cancelBooking };
export default { getStats, listBookings, getDetail, cancelBooking };
