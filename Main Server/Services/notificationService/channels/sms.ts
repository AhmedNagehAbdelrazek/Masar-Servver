// @ts-nocheck
import twilio from 'twilio';
import smsService from '../../smsService';
/**
 * SMS channel.
 *
 * Provider interface: send({ to, body })
 * - websmpp: Advance Messaging Systems (Broadnet) gateway (see SMS_API.pdf /
 *   HLR_API.pdf). Requires SMS_USERNAME / SMS_PASSWORD / SMS_SENDER_ID —
 *   the real production provider for this project.
 * - twilio: requires `twilio` package + TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM
 * - log (default): console fallback for development — never fails
 */
const provider = process.env.SMS_PROVIDER || 'log';

function buildProvider() {
  if (provider === 'websmpp') {
    // The channel must never throw upstream: a failed send is logged with
    // the provider's error code (e.g. HTTP18 = insufficient balance).
    return {
      async send({ to, body }) {
        const result = await smsService.sendSms(to, body);
        if (!result.success) {
          console.warn(
            `[sms:websmpp] send failed${result.errorCode ? ` (${result.errorCode})` : ''}: ${result.error}`,
            { to }
          );
        }
      },
    };
  }

  if (provider === 'twilio') {
    try {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      return {
        async send({ to, body }) {
          await client.messages.create({
            to,
            from: process.env.TWILIO_FROM,
            body,
          });
        },
      };
    } catch (err) {
      console.warn(
        '[sms] twilio provider requested but unavailable, falling back to log:',
        err.message
      );
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
  if (!user || !user.phone) return;
  await sms.send({ to: user.phone, body: message.body });
}

module.exports = { send };
export { send };
export default module.exports;