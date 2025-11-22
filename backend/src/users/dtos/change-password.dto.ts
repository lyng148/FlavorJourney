import { IsDefined, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

const passwordRegex = /(?=.*[A-Z])|(?=.*[a-z])|(?=.*\d)|(?=.*[^A-Za-z0-9])/g; 

export class ChangePasswordDto {
  @IsNotEmpty({ message: i18nValidationMessage('user.password.old_required') })
  oldPassword: string;

  @IsDefined({ message: i18nValidationMessage('user.password.new_required') })
  @MinLength(8, { message: i18nValidationMessage('user.password.minchar') })
  @Matches(passwordRegex, { 
    message: i18nValidationMessage('user.password.rule') 
  })
  password: string; 
  @IsDefined({ message: i18nValidationMessage('user.password.confirm_required') })
  confirmPassword: string;
}