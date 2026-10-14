var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SmsChannel_1;
import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';
let SmsChannel = SmsChannel_1 = class SmsChannel {
    logger = new Logger(SmsChannel_1.name);
    provider;
    constructor() {
        this.provider = process.env.SMS_PROVIDER ?? 'log';
    }
    async send(user, message) {
        if (!user?.phone)
            return;
        if (this.provider === 'twilio') {
            try {
                const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                await client.messages.create({
                    to: user.phone,
                    from: process.env.TWILIO_FROM,
                    body: message.body,
                });
                return;
            }
            catch (err) {
                this.logger.warn(`[sms] twilio failed, falling back to log: ${err.message}`);
            }
        }
        this.logger.debug(`[sms:log] to=${user.phone} body=${message.body}`);
    }
};
SmsChannel = SmsChannel_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], SmsChannel);
export { SmsChannel };
//# sourceMappingURL=sms.channel.js.map