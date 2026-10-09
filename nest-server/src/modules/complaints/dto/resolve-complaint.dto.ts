import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

// Port of resolveComplaintValidation. NOTE: "resolution required when
// resolving" is cross-field (needs body.status), enforced in
// ComplaintsService as 422 VALIDATION_ERROR — same envelope as Express.
export class ComplaintIdParam {
  @IsUUID()
  complaint_id!: string;
}

export class ResolveComplaintDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['reviewing', 'resolved', 'dismissed'])
  status!: 'reviewing' | 'resolved' | 'dismissed';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution?: string;
}
