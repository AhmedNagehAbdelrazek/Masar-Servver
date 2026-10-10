import { Injectable, Logger } from '@nestjs/common';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Port of Main Server/Services/notificationService/channels/push.ts
// (FCM HTTP v1 via firebase-admin). Best-effort, never throws; falls back to
// a dev log when credentials or the user's fcmToken are missing.
export interface PushUser {
  id: string;
  fcmToken?: string | null;
}

@Injectable()
export class PushChannel {
  private readonly logger = new Logger(PushChannel.name);
  private app: App | null = null;
  private initAttempted = false;
  private initError: Error | null = null;

  private getApp(): App | null {
    if (this.app) return this.app;
    if (this.initAttempted) return null;
    this.initAttempted = true;
    try {
      const existing = getApps();
      if (existing.length) {
        this.app = existing[0] as App;
        return this.app;
      }
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey) privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS && (!projectId || !clientEmail || !privateKey)) {
        this.app = initializeApp();
      } else if (projectId && clientEmail && privateKey) {
        this.app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
      } else {
        this.initError = new Error('missing Firebase credentials');
        return null;
      }
      return this.app;
    } catch (err) {
      this.initError = err as Error;
      this.logger.warn(`[push] firebase-admin init failed: ${(err as Error).message}`);
      return null;
    }
  }

  private static stringifyData(data: Record<string, unknown> = {}): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(data ?? {})) {
      if (value === undefined || value === null) continue;
      out[String(key)] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return out;
  }

  async send(
    user: PushUser,
    message: { type?: string; title: string; body: string },
    data: Record<string, unknown> = {},
  ): Promise<void> {
    if (!user?.fcmToken) return;
    const app = this.getApp();
    if (!app) {
      this.logger.debug(
        `[push:log] target=${user.id} title=${message.title} (fcm unconfigured: ${this.initError?.message ?? 'no credentials'})`,
      );
      return;
    }
    try {
      const type = message.type ? String(message.type) : undefined;
      await getMessaging(app).send({
        token: user.fcmToken,
        notification: { title: message.title, body: message.body },
        data: type ? { ...PushChannel.stringifyData(data), type } : PushChannel.stringifyData(data),
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } },
      });
    } catch (err) {
      const code = (err as { code?: string; errorInfo?: { code?: string } })?.code ??
        (err as { errorInfo?: { code?: string } })?.errorInfo?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument'
      ) {
        this.logger.warn(`[push] invalid fcm token for user=${user.id} (${code})`);
      } else {
        this.logger.warn(`[push] send failed: ${(err as Error).message}`);
      }
    }
  }
}
