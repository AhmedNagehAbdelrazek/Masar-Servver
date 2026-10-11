import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SupportTicketsController } from './support-tickets.controller.js';
import { SupportTicketsService } from './support-tickets.service.js';

@Module({
  imports: [NotificationsModule],
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService],
  exports: [SupportTicketsService],
})
export class SupportTicketsModule {}
