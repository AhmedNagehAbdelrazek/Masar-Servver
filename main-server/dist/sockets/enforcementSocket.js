"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const realtimeMetrics_1 = __importDefault(require("../Services/realtimeMetrics"));
const enforcementSocket = (io, socket) => {
    const user = socket.data.user;
    if (!user)
        return;
    socket.on('enforcement:ack', () => {
        realtimeMetrics_1.default.recordEvent('enforcement:ack');
    });
};
exports.default = enforcementSocket;
module.exports = enforcementSocket;
//# sourceMappingURL=enforcementSocket.js.map