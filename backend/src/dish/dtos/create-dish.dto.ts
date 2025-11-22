import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsUrl,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDishDto {
  @IsString()
  @IsNotEmpty()
  name_japanese: string;

  @IsString()
  @IsNotEmpty()
  name_vietnamese: string;

  @IsOptional()
  @IsString()
  name_romaji?: string;

  @IsOptional()
  @IsString()
  description_japanese?: string;

  @IsOptional()
  @IsString()
  description_vietnamese?: string;

  @IsOptional()
  @IsString()
  description_romaji?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  category_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  region_id?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  spiciness_level?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  saltiness_level?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  sweetness_level?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  sourness_level?: number;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsOptional()
  @IsString()
  how_to_eat?: string;

  @IsOptional()
  @IsUrl()
  image_url?: string;
}
