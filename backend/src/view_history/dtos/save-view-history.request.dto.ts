import { IsNotEmpty, IsNumber } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class SaveViewHistoryRequestDto {
  @IsNumber(
    {},
    {
      message: i18nValidationMessage('view_history.validation.dish_id_number'),
    },
  )
  @IsNotEmpty({
    message: i18nValidationMessage('view_history.validation.dish_id_required'),
  })
  dish_id: number;
}
