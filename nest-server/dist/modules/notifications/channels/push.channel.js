var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PushChannel_1;
import { Injectable, Logger } from '@nestjs/common';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
let PushChannel = PushChannel_1 = class PushChannel {
    logger = new Logger(PushChannel_1.name);
    app = null;
    initAttempted = false;
    initError = null;
    getApp() {
        if (this.app)
            return this.app;
        if (this.initAttempted)
            return null;
        this.initAttempted = true;
        try {
            const existing = getApps();
            if (existing.length) {
                this.app = existing[0];
                return this.app;
            }
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;
            if (privateKey)
                privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS && (!projectId || !clientEmail || !privateKey)) {
                this.app = initializeApp();
            }
            else if (projectId && clientEmail && privateKey) {
                this.app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
            }
            else {
                this.initError = new Error('missing Firebase credentials');
                return null;
            }
            return this.app;
        }
        catch (err) {
            this.initError = err;
            this.logger.warn(`[push] firebase-admin init failed: ${err.message}`);
            return null;
        }
    }
    static stringifyData(data = {}) {
        const out = {};
        for (const [key, value] of Object.entries(data ?? {})) {
            if (value === undefined || value === null)
                continue;
            out[String(key)] = typeof value === 'string' ? value : JSON.stringify(value);
        }
        return out;
    }
    async send(user, message, data = {}) {
        if (!user?.fcmToken)
            return;
        const app = this.getApp();
        if (!app) {
            this.logger.debug(`[push:log] target=${user.id} title=${message.title} (fcm unconfigured: ${this.initError?.message ?? 'no credentials'})`);
            return;
        }
        try {
            const type = message.type ? String(message.type) : undefined;
            await getMessaging(app).send({
                token: user.fcmToken,
                notification: { title: message.title, body: message.body },
                data: type ? { ...PushChannel_1.stringifyData(data), type } : PushChannel_1.stringifyData(data),
                android: { priority: 'high' },
                apns: { headers: { 'apns-priority': '10' } },
            });
        }
        catch (err) {
            const code = err?.code ??
                err?.errorInfo?.code;
            if (code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/invalid-registration-token' ||
                code === 'messaging/invalid-argument') {
                this.logger.warn(`[push] invalid fcm token for user=${user.id} (${code})`);
            }
            else {
                this.logger.warn(`[push] send failed: ${err.message}`);
            }
        }
    }
};
PushChannel = PushChannel_1 = __decorate([
    Injectable()
], PushChannel);
export { PushChannel };
//# sourceMappingURL=push.channel.js.map