import { Module } from '@nestjs/common';
import { WebsmppSmsService } from './websmpp-sms.service.js';

/**
 * SMS module — direct access to the Advance Messaging Systems (Broadnet)
 * websmpp gateway (see SMS_API.pdf / HLR_API.pdf). Exported so other
 * modules (e.g. notifications, auth/OTP) can send SMS directly.
 */
@Module({
  providers: [WebsmppSmsService],
  exports: [WebsmppSmsService],
})
export class SmsModule {}
