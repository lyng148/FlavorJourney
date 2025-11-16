import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
  @IsEmail(
    {},
    { message: i18nValidationMessage('auth.validation.email_invalid') },
  )
  @IsNotEmpty({
    message: i18nValidationMessage('auth.validation.email_required'),
  })
  email: string;

  @IsNotEmpty({
    message: i18nValidationMessage('auth.validation.password_required'),
  })
  @MinLength(1, {
    message: i18nValidationMessage('auth.validation.password_min'),
  })
  password: string;

  @IsOptional()
  @IsBoolean()
  saveLoginInfo?: boolean;
}
