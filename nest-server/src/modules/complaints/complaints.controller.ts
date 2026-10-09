import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { ComplaintsService } from './complaints.service.js';
import { CreateComplaintDto } from './dto/create-complaint.dto.js';

// Express parity: Routes/complaintRoutes.ts POST /api/complaints (any auth).
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Post()
  @HttpCode(200)
  createComplaint(
    @Body() dto: CreateComplaintDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ complaint: Record<string, unknown>; already_filed: boolean }> {
    return this.complaints.create(user?.id ?? '', dto);
  }
}
