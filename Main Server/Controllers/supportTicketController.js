const supportTicketService = require('../Services/supportTicketService');
const { successResponse } = require('../utils/httpResponse');
const { markResource } = require('../Services/auditService');
const catchAsync = require('../utils/catchAsync');

const createTicket = catchAsync(async (req, res) => {
  const support_ticket = await supportTicketService.createTicket(req.user, req.body);
  markResource(res, { type: 'support_ticket', id: support_ticket.id, label: `ticket ${support_ticket.reference_code}` });
  successResponse(res, { support_ticket }, 201);
});

const listTickets = catchAsync(async (req, res) => {
  const result = await supportTicketService.listTickets(req.user, req.query);
  successResponse(res, result);
});

const getTicket = catchAsync(async (req, res) => {
  const result = await supportTicketService.getTicket(req.user, req.params.ticket_id);
  markResource(res, { type: 'support_ticket', id: req.params.ticket_id });
  successResponse(res, result);
});

const updateTicket = catchAsync(async (req, res) => {
  const support_ticket = await supportTicketService.updateTicket(req.user.id, req.params.ticket_id, req.body);
  markResource(res, { type: 'support_ticket', id: req.params.ticket_id });
  successResponse(res, { support_ticket });
});

const updateStatus = catchAsync(async (req, res) => {
  const support_ticket = await supportTicketService.updateTicketStatus(req.user.id, req.params.ticket_id, req.body.status);
  markResource(res, { type: 'support_ticket', id: req.params.ticket_id });
  successResponse(res, { support_ticket });
});

const addMessage = catchAsync(async (req, res) => {
  const ticket_message = await supportTicketService.addMessage(req.user, req.params.ticket_id, req.body.message);
  markResource(res, { type: 'support_ticket', id: req.params.ticket_id, label: 'message added' });
  successResponse(res, { ticket_message }, 201);
});

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  updateStatus,
  addMessage,
};
