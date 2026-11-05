"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSosEscalation = runSosEscalation;
const sosService_1 = require("../Services/sosService");
async function runSosEscalation() {
    const { alerted, escalated } = await sosService_1.runEscalation();
    return { alerted, escalated };
}
exports.default = { runSosEscalation };
module.exports = { runSosEscalation };
//# sourceMappingURL=sosEscalationJob.js.map