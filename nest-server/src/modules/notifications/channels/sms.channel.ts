import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';

// Port of Main Server/Services/notificationService/channels/sms.ts.
// SMS_PROVIDER=twilio uses Twilio; anything else (default `log`) is a
// console fallback for development — never fails.
export interface SmsUser {
  phone?: string | null;
}

@Injectable()
export class SmsChannel {
  private readonly logger = new Logger(SmsChannel.name);
  private readonly provider: string;

  constructor() {
    this.provider = process.env.SMS_PROVIDER ?? 'log';
  }

  async send(user: SmsUser, message: { body: string }): Promise<void> {
    if (!user?.phone) return;
    if (this.provider === 'twilio') {
      try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await client.messages.create({
          to: user.phone,
          from: process.env.TWILIO_FROM,
          body: message.body,
        });
        return;
      } catch (err) {
        this.logger.warn(`[sms] twilio failed, falling back to log: ${(err as Error).message}`);
      }
    }
    this.logger.debug(`[sms:log] to=${user.phone} body=${message.body}`);
  }
}
