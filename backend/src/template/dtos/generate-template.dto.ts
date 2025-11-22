import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateTemplateDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  dishId: number;

  @IsString()
  context: string;
}
