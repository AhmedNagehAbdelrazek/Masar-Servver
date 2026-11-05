// @ts-nocheck
/**
 * Push channel (FCM HTTP v1 via firebase-admin v14 modular API).
 *
 * Credentials (set in .env — copied from the Firebase service-account JSON):
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *   (optional: FIREBASE_PRIVATE_KEY_ID, FIREBASE_CLIENT_ID)
 *   Alternative: GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *
 * Behaviour: best-effort, never throws — a push failure can never break a
 * booking/balance/subscription transaction. Falls back to a dev log when
 * credentials or the user's fcmToken are missing.
 */
let initAttempted = false;
let initError = null;
let cachedApp = null;

function getApp() {
  if (cachedApp) return cachedApp;
  if (initAttempted) return null;
  initAttempted = true;
  try {
    // eslint-disable-next-line global-require
    const appMod = require('firebase-admin/app');
    const { initializeApp, getApps, cert } = appMod;
    if (getApps().length) {
      cachedApp = getApps()[0];
      return cachedApp;
    }
    const projectId = process.env.FIREBASE_PROJECT_ID;
    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
    }
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && (!projectId || !clientEmail || !privateKey)) {
      cachedApp = initializeApp();
    } else if (projectId && clientEmail && privateKey) {
      cachedApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      initError = new Error(
        'missing Firebase credentials (FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY or GOOGLE_APPLICATION_CREDENTIALS)'
      );
      return null;
    }
    return cachedApp;
  } catch (err) {
    initError = err;
    console.warn('[push] firebase-admin init failed:', err.message);
    return null;
  }
}

function isConfigured() {
  return Boolean(getApp());
}

function getInitError() {
  getApp();
  return initError;
}

function stringifyData(data = {}) {
  const out = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (value === undefined || value === null) continue;
    out[String(key)] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return out;
}

async function send(user, message, data = {}) {
  if (!user || !user.fcmToken) {
    return;
  }

  const app = getApp();
  if (!app) {
    console.log(
      `[push:log] target=${user.id} title=${message.title} body=${message.body} (fcm unconfigured: ${initError ? initError.message : 'no credentials'})`
    );
    return;
  }

  try {
    // eslint-disable-next-line global-require
    const { getMessaging } = require('firebase-admin/messaging');
    const type = message.type ? String(message.type) : undefined;
    await getMessaging(app).send({
      token: user.fcmToken,
      notification: {
        title: message.title,
        body: message.body,
      },
      data: type ? { ...stringifyData(data), type } : stringifyData(data),
      android: { priority: 'high' },
      apns: { headers: { 'apns-priority': '10' } },
    });
  } catch (err) {
    const code = err && (err.code || err.errorInfo?.code);
    // Stale/uninstalled app tokens are normal — log so the token can be
    // refreshed client-side; never throw into the calling transaction.
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/invalid-argument'
    ) {
      console.warn(`[push] invalid fcm token for user=${user.id} (${code})`);
    } else {
      console.warn('[push] send failed:', err.message);
    }
  }
}

module.exports = { send, isConfigured, getInitError };
export { send, isConfigured, getInitError };
export default module.exports;
