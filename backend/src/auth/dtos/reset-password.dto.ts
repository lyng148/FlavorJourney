import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

const passwordRegex = /^(?:(?=.*[a-z])(?=.*[A-Z])|(?=.*[a-z])(?=.*\d)|(?=.*[a-z])(?=.*[^A-Za-z0-9])|(?=.*[A-Z])(?=.*\d)|(?=.*[A-Z])(?=.*[^A-Za-z0-9])|(?=.*\d)(?=.*[^A-Za-z0-9])).*$/;

export class ResetPasswordDto {
  @IsNotEmpty({ message: i18nValidationMessage('auth.reset.token_required') })
  @IsString({ message: i18nValidationMessage('auth.reset.token_string') })
  token: string;

  @IsNotEmpty({ message: i18nValidationMessage('auth.reset.password_required') })
  @MinLength(8, { message: i18nValidationMessage('auth.reset.password_min_length') })
  @Matches(passwordRegex, {
    message: i18nValidationMessage('auth.reset.password_strength'),
  })
  password: string;

  @IsNotEmpty({ message: i18nValidationMessage('auth.reset.confirm_password_required') })
  confirmPassword: string;
}
