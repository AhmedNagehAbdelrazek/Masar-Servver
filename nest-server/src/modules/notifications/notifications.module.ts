import { forwardRef, Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { InAppChannel } from './channels/in-app.channel.js';
import { PushChannel } from './channels/push.channel.js';
import { SmsChannel } from './channels/sms.channel.js';
import { NotificationSettingsController } from './notification-settings.controller.js';
import { NotificationSettingsService } from './notification-settings.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  imports: [forwardRef(() => RealtimeModule)],
  controllers: [NotificationsController, NotificationSettingsController],
  providers: [NotificationsService, NotificationSettingsService, SmsChannel, PushChannel, InAppChannel],
  exports: [NotificationsService, NotificationSettingsService],
})
export class NotificationsModule {}
