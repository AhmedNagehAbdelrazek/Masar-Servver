import { IsNotEmpty, IsString, IsIn, MaxLength, MinLength } from 'class-validator';

// Figma 9928:23297 (إرسال إشعار للسائق): title + body + type chips
// (متعلق بالباقة / عام / متعلق بالرحلة / متعلق بالحساب / متعلق بالتوثيق).
export class SendDriverNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['trip', 'general', 'account', 'verification', 'package'])
  type!: string;
}
