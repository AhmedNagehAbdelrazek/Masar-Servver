import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as messageService from '../Services/messageService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const getBookingMessages = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { bookingId } = req.params as { bookingId: string };
  const { page, limit, before_id } = req.query as { page?: string; limit?: string; before_id?: string };
  const result = await (messageService as unknown as { listBookingMessages: (user: { id: string; role: string } | undefined, opts: unknown) => Promise<unknown> }).listBookingMessages(authReq.user as { id: string; role: string }, {
    bookingId,
    page,
    limit,
    beforeId: before_id,
  });
  successResponse(res, result);
});

const getTicketMessages = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { ticketId } = req.params as { ticketId: string };
  const { page, limit, before_id } = req.query as { page?: string; limit?: string; before_id?: string };
  const result = await (messageService as unknown as { listSupportMessages: (user: { id: string; role: string } | undefined, opts: unknown) => Promise<unknown> }).listSupportMessages(authReq.user as { id: string; role: string }, {
    supportTicketId: ticketId,
    page,
    limit,
    beforeId: before_id,
  });
  successResponse(res, result);
});

export { getBookingMessages, getTicketMessages };
export default { getBookingMessages, getTicketMessages };
