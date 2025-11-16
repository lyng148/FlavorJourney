import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
  IsString,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

const passwordRegex = /(?=.*[A-Z])|(?=.*[a-z])|(?=.*\d)|(?=.*[^A-Za-z0-9])/g;

export class RegisterDto {
  @IsEmail(
    {},
    { message: i18nValidationMessage('auth.validation.email_invalid') },
  )
  @IsNotEmpty({
    message: i18nValidationMessage('auth.validation.email_required'),
  })
  email: string;

  @IsString({
    message: i18nValidationMessage('auth.validation.username_string'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('auth.validation.username_required'),
  })
  username: string;

  @IsNotEmpty({
    message: i18nValidationMessage('auth.validation.password_required'),
  })
  @MinLength(8, {
    message: i18nValidationMessage('auth.validation.password_min8'),
  })
  @Matches(passwordRegex, {
    message: i18nValidationMessage('auth.validation.password_rule'),
  })
  password: string;

  @IsNotEmpty({
    message: i18nValidationMessage('auth.validation.confirm_password_required'),
  })
  confirmPassword: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({
    message: i18nValidationMessage('auth.validation.birthday_invalid'),
  })
  birthday?: Date;

  @IsOptional()
  @IsString()
  location?: string;
}
