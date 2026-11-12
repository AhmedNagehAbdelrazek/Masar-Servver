import { Module } from '@nestjs/common';
import { AdminSearchController } from './admin-search.controller.js';
import { AdminSearchService } from './admin-search.service.js';

@Module({
  controllers: [AdminSearchController],
  providers: [AdminSearchService],
  exports: [AdminSearchService],
})
export class AdminSearchModule {}
