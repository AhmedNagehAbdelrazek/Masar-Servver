import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

// Ports of create/update/param validators for payment methods.
// Admin mount uses utils/validators/planValidator.ts (email '' -> null);
// the /payment-methods mount uses paymentMethodValidator.ts (email '' -> 422).
// Untested edge: both mounts share these DTOs (admin semantics).
export const PAYMENT_METHOD_TYPES = ['bank_account', 'e-wallet', 'mobile_money'] as const;

export class CreatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  account_number!: string;

  @IsIn([...PAYMENT_METHOD_TYPES])
  type!: (typeof PAYMENT_METHOD_TYPES)[number];

  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: unknown }) => (value === '' ? null : value))
  email?: string | null;
}

export class UpdatePaymentMethodDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  account_number?: string;

  @IsOptional()
  @IsIn([...PAYMENT_METHOD_TYPES])
  type?: (typeof PAYMENT_METHOD_TYPES)[number];

  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: unknown }) => (value === '' ? null : value))
  email?: string | null;
}

// Express applies methodParamValidation WITH `validate` on admin PUT/DELETE
// and admin-mount DELETE (422 on bad UUID), but WITHOUT it on the
// /payment-methods-mount DELETE (falls through to 404). Use accordingly.
export class UuidMethodIdParam {
  @IsUUID()
  method_id!: string;
}
