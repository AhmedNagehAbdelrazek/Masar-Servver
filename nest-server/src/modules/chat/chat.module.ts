import { forwardRef, Module } from '@nestjs/common';
import { RealtimeModule } from '../../realtime/realtime.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [forwardRef(() => RealtimeModule), forwardRef(() => NotificationsModule)],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
