"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEventId = generateEventId;
exports.generateTraceId = generateTraceId;
exports.generateSpanId = generateSpanId;
exports.generateRequestId = generateRequestId;
const node_crypto_1 = require("node:crypto");
function generateEventId() {
    return (0, node_crypto_1.randomUUID)();
}
function generateTraceId() {
    return `trace-${(0, node_crypto_1.randomBytes)(16).toString('hex')}`;
}
function generateSpanId() {
    return `span-${(0, node_crypto_1.randomBytes)(8).toString('hex')}`;
}
function generateRequestId() {
    return `req-${(0, node_crypto_1.randomBytes)(8).toString('hex')}`;
}
//# sourceMappingURL=ids.js.map