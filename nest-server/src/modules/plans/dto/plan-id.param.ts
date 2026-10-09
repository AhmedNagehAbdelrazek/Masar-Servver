import { IsUUID } from 'class-validator';

// Port of planIdValidation. NOTE: Express applies it WITHOUT the `validate`
// middleware on DELETE /admin/plans/:id (so a bad UUID falls through to a
// 404), but WITH validation on PUT. Use UuidPlanIdParam for PUT only.
export class UuidPlanIdParam {
  @IsUUID()
  plan_id!: string;
}
