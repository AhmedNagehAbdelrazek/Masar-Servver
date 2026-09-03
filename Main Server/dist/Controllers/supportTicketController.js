"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMessage = exports.updateStatus = exports.updateTicket = exports.getTicket = exports.listTickets = exports.createTicket = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const httpResponse_1 = require("../utils/httpResponse");
const supportTicketService = __importStar(require("../Services/supportTicketService"));
const auditService = __importStar(require("../Services/auditService"));
const createTicket = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const supportTicket = await supportTicketService.createTicket(authReq.user, req.body);
    auditService.markResource(res, { type: 'support_ticket', id: supportTicket.id, label: `ticket ${supportTicket.reference_code}` });
    (0, httpResponse_1.successResponse)(res, { support_ticket: supportTicket }, 201);
});
exports.createTicket = createTicket;
const listTickets = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const result = await supportTicketService.listTickets(authReq.user, req.query);
    (0, httpResponse_1.successResponse)(res, result);
});
exports.listTickets = listTickets;
const getTicket = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { ticket_id } = req.params;
    const result = await supportTicketService.getTicket(authReq.user, ticket_id);
    auditService.markResource(res, { type: 'support_ticket', id: ticket_id });
    (0, httpResponse_1.successResponse)(res, result);
});
exports.getTicket = getTicket;
const updateTicket = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { ticket_id } = req.params;
    const supportTicket = await supportTicketService.updateTicket(String(authReq.user?.id), ticket_id, req.body);
    auditService.markResource(res, { type: 'support_ticket', id: ticket_id });
    (0, httpResponse_1.successResponse)(res, { support_ticket: supportTicket });
});
exports.updateTicket = updateTicket;
const updateStatus = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { ticket_id } = req.params;
    const { status } = req.body;
    const supportTicket = await supportTicketService.updateTicketStatus(String(authReq.user?.id), ticket_id, status);
    auditService.markResource(res, { type: 'support_ticket', id: ticket_id });
    (0, httpResponse_1.successResponse)(res, { support_ticket: supportTicket });
});
exports.updateStatus = updateStatus;
const addMessage = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const authReq = req;
    const { ticket_id } = req.params;
    const { message } = req.body;
    const ticketMessage = await supportTicketService.addMessage(authReq.user, ticket_id, message);
    auditService.markResource(res, { type: 'support_ticket', id: ticket_id, label: 'message added' });
    (0, httpResponse_1.successResponse)(res, { ticket_message: ticketMessage }, 201);
});
exports.addMessage = addMessage;
exports.default = { createTicket, listTickets, getTicket, updateTicket, updateStatus, addMessage };
//# sourceMappingURL=supportTicketController.js.map