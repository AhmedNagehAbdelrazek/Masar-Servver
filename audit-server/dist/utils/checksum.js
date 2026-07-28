"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChecksum = generateChecksum;
const node_crypto_1 = __importDefault(require("node:crypto"));
function generateChecksum(event) {
    const canonical = JSON.stringify({
        event_id: event.id,
        trace_id: event.trace_id,
        span_id: event.span_id,
        service_name: event.service_name,
        action: event.action,
        path: event.path,
        status_code: event.status_code,
        event_time: event.event_time,
    });
    return node_crypto_1.default.createHash('sha256').update(canonical).digest('hex');
}
//# sourceMappingURL=checksum.js.map