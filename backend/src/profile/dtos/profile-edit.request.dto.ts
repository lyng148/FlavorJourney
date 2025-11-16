import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ProfileEditRequestDto {
  @IsNotEmpty({
    message: i18nValidationMessage('profile.validation.id_required'),
  })
  @IsNumber(
    {},
    { message: i18nValidationMessage('profile.validation.id_number') },
  )
  id: number;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage('profile.validation.location_string'),
  })
  location?: string;

  // birthday format: 'YYYY-MM-DD'
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('profile.validation.birthday_string'),
  })
  birthday?: string;

  @IsOptional()
  @IsEmail(
    {},
    { message: i18nValidationMessage('profile.validation.email_invalid') },
  )
  email?: string;
}
