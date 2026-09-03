import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as bookingService from '../Services/bookingService';
import * as delayService from '../Services/delayService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const createBooking = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const booking = await (bookingService as unknown as { createBooking: (userId: string, body: unknown) => Promise<{ id: string; reference_code: string }> }).createBooking(String(authReq.user?.id), req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'booking', id: booking.id, label: `booking ${booking.reference_code}` });
  successResponse(res, { booking }, 201);
});

const listMyBookings = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (bookingService as unknown as { listForPassenger: (userId: string, q: unknown) => Promise<unknown> }).listForPassenger(String(authReq.user?.id), req.query);
  successResponse(res, result);
});

const getBooking = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { booking_id } = req.params as { booking_id: string };
  const result = await (bookingService as unknown as { getForPassenger: (userId: string, id: string) => Promise<{ booking: { reference_code: string } }> }).getForPassenger(String(authReq.user?.id), booking_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'booking', id: booking_id, label: `booking ${result.booking.reference_code}` });
  successResponse(res, result);
});

const cancelBooking = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { booking_id } = req.params as { booking_id: string };
  const result = await (bookingService as unknown as { cancelBooking: (userId: string, id: string) => Promise<{ booking: { id: string } }> }).cancelBooking(String(authReq.user?.id), booking_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'booking', id: booking_id, label: `booking ${result.booking.id}` });
  successResponse(res, result);
});

const getDriverProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { booking_id } = req.params as { booking_id: string };
  const result = await (bookingService as unknown as { getDriverReveal: (userId: string, role: string, id: string) => Promise<unknown> }).getDriverReveal(String(authReq.user?.id), String(authReq.user?.role), booking_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'booking', id: booking_id, action: 'driver_profile_revealed' });
  successResponse(res, result);
});

const reportDelay = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { booking_id } = req.params as { booking_id: string };
  const delayEvent = await (delayService as unknown as { reportDelay: (user: { id: string; role: string } | undefined, bookingId: string, body: unknown) => Promise<{ id: string }> }).reportDelay(authReq.user as { id: string; role: string }, booking_id, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'delay_event', id: delayEvent.id });
  successResponse(res, { delay_event: delayEvent }, 201);
});

const listDelays = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { booking_id } = req.params as { booking_id: string };
  const result = await (delayService as unknown as { listDelays: (user: { id: string; role: string } | undefined, bookingId: string, q: unknown) => Promise<unknown> }).listDelays(authReq.user as { id: string; role: string }, booking_id, req.query);
  successResponse(res, result);
});

export { createBooking, listMyBookings, getBooking, cancelBooking, getDriverProfile, reportDelay, listDelays };
export default { createBooking, listMyBookings, getBooking, cancelBooking, getDriverProfile, reportDelay, listDelays };
