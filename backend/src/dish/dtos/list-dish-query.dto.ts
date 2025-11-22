import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListDishesQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  spiciness_level?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  saltiness_level?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  sweetness_level?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  sourness_level?: number;

  // giữ các trường hiện tại
  @IsOptional()
  search?: string;
  @IsOptional()
  category?: string[];
  @IsOptional()
  region?: string[];
  @IsOptional()
  sort?: 'latest' | 'popular';
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number;
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;
}
