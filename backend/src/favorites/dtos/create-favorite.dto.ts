import { IsInt, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFavoriteDto {
  @Type(() => Number) 
  @IsInt({ message: 'favorite.DISH_ID_INVALID' })
  @Min(1, { message: 'favorite.DISH_ID_INVALID' })
  @IsNotEmpty({ message: 'favorite.DISH_ID_INVALID' })
  dishId: number;
}