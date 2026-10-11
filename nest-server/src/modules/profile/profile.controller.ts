import { Body, Controller, Get, Put } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import type { AuthUser } from '../../common/guards/jwt-auth.guard.js';
import { HomeService } from '../subscriptions/home.service.js';
import { UpdatePassengerProfileDto } from './dto/update-profile.dto.js';
import { ProfileService } from './profile.service.js';

// Express parity: Routes/profileRoutes.ts at /api/profile/passenger
// (all protect + passenger).
@Controller('profile/passenger')
@Roles('passenger')
export class ProfileController {
  constructor(
    private readonly profile: ProfileService,
    private readonly home: HomeService,
  ) {}

  @Get()
  getMyProfile(@CurrentUser() user?: AuthUser): Promise<{
    passenger_profile: {
      full_name: string | null;
      age: number | null;
      gender: string | null;
      phone: string | null;
      national_id: string | null;
      home_address: string | null;
    };
  }> {
    return this.profile.getMyProfile(user?.id ?? '');
  }

  @Put()
  updateMyProfile(
    @Body() dto: UpdatePassengerProfileDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<{ passenger_profile: Record<string, unknown> }> {
    return this.profile.updateMyProfile(user?.id ?? '', dto);
  }

  @Get('account-summary')
  getAccountSummary(@CurrentUser() user?: AuthUser): Promise<{
    account_summary: { type: string; count: number }[];
  }> {
    return this.profile.getAccountSummary(user?.id ?? '');
  }

  @Get('home')
  getPassengerHome(@CurrentUser() user?: AuthUser): Promise<Record<string, unknown>> {
    return this.home.getPassengerHome(user?.id ?? '');
  }
}
