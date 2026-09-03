"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.send = send;
// @ts-nocheck
/**
 * Push channel (FCM).
 *
 * Uses the FCM HTTP v1 API when FCM_SERVER_KEY is set and the user has an
 * fcmToken. Falls back to a dev log when unavailable — never throws, so a
 * push failure can never break a balance/subscription transaction.
 */
async function send(user, message, data = {}) {
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!user || !user.fcmToken || !serverKey) {
        if (!process.env.FCM_SERVER_KEY) {
            console.log(`[push:log] target=${user && user.id} title=${message.title} body=${message.body}`);
        }
        return;
    }
    try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `key=${serverKey}`,
            },
            body: JSON.stringify({
                to: user.fcmToken,
                notification: {
                    title: message.title,
                    body: message.body,
                },
                data: { ...data, type: message.type },
                priority: 'high',
            }),
        });
        if (!response.ok) {
            console.warn(`[push] FCM responded ${response.status}`);
        }
    }
    catch (err) {
        console.warn('[push] send failed:', err.message);
    }
}
module.exports = { send };
exports.default = module.exports;
//# sourceMappingURL=push.js.map