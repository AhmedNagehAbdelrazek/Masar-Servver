"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.send = send;
// @ts-nocheck
const twilio_1 = __importDefault(require("twilio"));
/**
 * SMS channel.
 *
 * Provider interface: send({ to, body })
 * - twilio: requires `twilio` package + TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM
 * - log (default): console fallback for development — never fails
 */
const provider = process.env.SMS_PROVIDER || 'log';
function buildProvider() {
    if (provider === 'twilio') {
        try {
            const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            return {
                async send({ to, body }) {
                    await client.messages.create({
                        to,
                        from: process.env.TWILIO_FROM,
                        body,
                    });
                },
            };
        }
        catch (err) {
            console.warn('[sms] twilio provider requested but unavailable, falling back to log:', err.message);
        }
    }
    return {
        async send({ to, body }) {
            console.log(`[sms:log] to=${to} body=${body}`);
        },
    };
}
const sms = buildProvider();
/**
 * @param {{ phone?: string }} user
 * @param {{ body: string }} message
 */
async function send(user, message) {
    if (!user || !user.phone)
        return;
    await sms.send({ to: user.phone, body: message.body });
}
module.exports = { send };
exports.default = module.exports;
//# sourceMappingURL=sms.js.map