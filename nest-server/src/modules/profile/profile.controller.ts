import { Controller } from '@nestjs/common';

// Express parity: Routes/profileRoutes.ts mounted at /api/profile/passenger
// (all routes protect + roleGuard(['passenger'])).
@Controller('profile/passenger')
export class ProfileController {}
