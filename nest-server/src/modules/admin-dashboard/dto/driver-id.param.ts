import { IsUUID } from 'class-validator';

// Port of driverIdParamValidation (adminDashboardValidator.ts).
export class DriverIdParam {
  @IsUUID()
  driver_id!: string;
}
