import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BalanceModule } from '../balance/balance.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SmsModule } from '../sms/sms.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { OtpService } from './otp.service.js';

@Module({
  imports: [JwtModule.register({}), BalanceModule, NotificationsModule, SmsModule],
  controllers: [AuthController],
  providers: [AuthService, OtpService],
  exports: [AuthService],
})
export class AuthModule {}
