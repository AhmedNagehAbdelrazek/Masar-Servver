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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const protect_1 = __importDefault(require("../middlewares/protect"));
const roleGuard_1 = require("../middlewares/roleGuard");
const validatorMiddleware_1 = __importDefault(require("../middlewares/validatorMiddleware"));
const c = __importStar(require("../Controllers/supportTicketController"));
const v = __importStar(require("../utils/validators/supportTicketValidator"));
router.use(protect_1.default);
router.post('/', ...v.createTicketValidation, validatorMiddleware_1.default, c.createTicket);
router.get('/', ...v.listTicketsValidation, validatorMiddleware_1.default, c.listTickets);
router.get('/:ticket_id', ...v.ticketParamValidation, c.getTicket);
router.put('/:ticket_id', (0, roleGuard_1.roleGuard)(['admin', 'support', 'moderator']), ...v.updateTicketValidation, validatorMiddleware_1.default, c.updateTicket);
router.put('/:ticket_id/status', (0, roleGuard_1.roleGuard)(['admin', 'support', 'moderator']), ...v.updateTicketStatusValidation, validatorMiddleware_1.default, c.updateStatus);
router.post('/:ticket_id/messages', ...v.addMessageValidation, validatorMiddleware_1.default, c.addMessage);
exports.default = router;
module.exports = router;
//# sourceMappingURL=supportTicketRoutes.js.map