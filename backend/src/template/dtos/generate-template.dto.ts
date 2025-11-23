import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateTemplateDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  dishId: number;

  @IsString()
  @IsOptional()
  context?: string;
}
