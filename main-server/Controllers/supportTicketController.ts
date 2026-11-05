import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { successResponse } from '../utils/httpResponse';
import * as supportTicketService from '../Services/supportTicketService';
import * as auditService from '../Services/auditService';

type AuthRequest = Request & { user?: { id: string; role: string } };

const createTicket = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const supportTicket = await (supportTicketService as unknown as { createTicket: (user: { id: string; role: string } | undefined, body: unknown) => Promise<{ id: string; reference_code: string }> }).createTicket(authReq.user as { id: string; role: string }, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'support_ticket', id: supportTicket.id, label: `ticket ${supportTicket.reference_code}` });
  successResponse(res, { support_ticket: supportTicket }, 201);
});

const listTickets = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const result = await (supportTicketService as unknown as { listTickets: (user: { id: string; role: string } | undefined, q: unknown) => Promise<unknown> }).listTickets(authReq.user as { id: string; role: string }, req.query);
  successResponse(res, result);
});

const getTicket = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { ticket_id } = req.params as { ticket_id: string };
  const result = await (supportTicketService as unknown as { getTicket: (user: { id: string; role: string } | undefined, id: string) => Promise<unknown> }).getTicket(authReq.user as { id: string; role: string }, ticket_id);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'support_ticket', id: ticket_id });
  successResponse(res, result);
});

const updateTicket = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { ticket_id } = req.params as { ticket_id: string };
  const supportTicket = await (supportTicketService as unknown as { updateTicket: (userId: string, ticketId: string, body: unknown) => Promise<{ id: string }> }).updateTicket(String(authReq.user?.id), ticket_id, req.body);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'support_ticket', id: ticket_id });
  successResponse(res, { support_ticket: supportTicket });
});

const updateStatus = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { ticket_id } = req.params as { ticket_id: string };
  const { status } = req.body as { status: string };
  const supportTicket = await (supportTicketService as unknown as { updateTicketStatus: (userId: string, ticketId: string, status: string) => Promise<{ id: string }> }).updateTicketStatus(String(authReq.user?.id), ticket_id, status);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'support_ticket', id: ticket_id });
  successResponse(res, { support_ticket: supportTicket });
});

const addMessage = catchAsync(async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  const { ticket_id } = req.params as { ticket_id: string };
  const { message } = req.body as { message: string };
  const ticketMessage = await (supportTicketService as unknown as { addMessage: (user: { id: string; role: string } | undefined, ticketId: string, message: string) => Promise<{ id: string }> }).addMessage(authReq.user as { id: string; role: string }, ticket_id, message);
  (auditService as unknown as { markResource: (res: Response, r: unknown) => void }).markResource(res, { type: 'support_ticket', id: ticket_id, label: 'message added' });
  successResponse(res, { ticket_message: ticketMessage }, 201);
});

export { createTicket, listTickets, getTicket, updateTicket, updateStatus, addMessage };
export default { createTicket, listTickets, getTicket, updateTicket, updateStatus, addMessage };
