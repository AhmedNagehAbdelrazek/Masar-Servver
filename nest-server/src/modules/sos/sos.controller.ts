import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ResolveSosDto, SosIdParam, SosListQuery } from './dto/sos.query.js';
import { SosService } from './sos.service.js';

// Express parity: Routes/sosRoutes.ts mounted at /api/admin/sos (all protect
// + admin). SOS management: list, ack, resolve.
@Controller('admin/sos')
@Roles('admin')
export class SosController {
  constructor(private readonly sos: SosService) {}

  @Get()
  listSos(
    @Query() query: SosListQuery,
    @CurrentUser() _user?: AuthUser,
  ): Promise<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }> {
    return this.sos.listAdmin({ id: '', role: 'admin' }, {
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }

  @Post(':id/ack')
  @HttpCode(200)
  ackSos(
    @Param() params: SosIdParam,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ sos_event: Record<string, unknown> }> {
    return this.sos.acknowledge({ id: user?.id ?? '', role: user?.role ?? '' }, params.id);
  }

  @Post(':id/resolve')
  @HttpCode(200)
  resolveSos(
    @Param() params: SosIdParam,
    @Body() dto: ResolveSosDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ sos_event: Record<string, unknown> }> {
    return this.sos.resolve(
      { id: user?.id ?? '', role: user?.role ?? '' },
      params.id,
      dto.resolution_note,
    );
  }
}
