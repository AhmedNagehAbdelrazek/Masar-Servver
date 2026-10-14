import { Module } from '@nestjs/common';
import { DriverModule } from '../driver/driver.module.js';
import { AdminConversationsController } from './admin-conversations.controller.js';
import { AdminConversationsService } from './admin-conversations.service.js';

// PenaltyService is reused from DriverModule so warning / suspension / ban
// semantics stay canonical across roles.
@Module({
  imports: [DriverModule],
  controllers: [AdminConversationsController],
  providers: [AdminConversationsService],
  exports: [AdminConversationsService],
})
export class AdminConversationsModule {}
