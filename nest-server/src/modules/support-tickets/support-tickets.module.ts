import { Module } from '@nestjs/common';
import { SupportTicketsController } from './support-tickets.controller.js';
import { SupportTicketsService } from './support-tickets.service.js';

@Module({
  controllers: [SupportTicketsController],
  providers: [SupportTicketsService]
})
export class SupportTicketsModule {}
