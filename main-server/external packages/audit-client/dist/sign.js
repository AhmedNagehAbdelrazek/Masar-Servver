"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAuditRequest = signAuditRequest;
const node_crypto_1 = __importDefault(require("node:crypto"));
function signAuditRequest(params) {
    const timestamp = Date.now().toString();
    const bodyHash = node_crypto_1.default
        .createHash('sha256')
        .update(params.body)
        .digest('hex');
    const signature = node_crypto_1.default
        .createHmac('sha256', params.clientSecret)
        .update(`${timestamp}.${bodyHash}`)
        .digest('hex');
    return {
        'X-Audit-Service-Id': params.serviceId,
        'X-Audit-Client-Key': params.clientKey,
        'X-Audit-Timestamp': timestamp,
        'X-Audit-Signature': signature,
    };
}
//# sourceMappingURL=sign.js.map