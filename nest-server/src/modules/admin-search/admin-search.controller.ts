import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminSearchService, type AdminSearchQuery } from './admin-search.service.js';

@Controller('admin/search')
@Roles('admin')
export class AdminSearchController {
  constructor(private readonly search: AdminSearchService) {}

  @Get()
  run(@Query() query: AdminSearchQuery): Promise<Record<string, unknown>> {
    return this.search.search(query);
  }
}
