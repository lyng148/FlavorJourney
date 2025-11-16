import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';

export class UpdateDishDto {
    @IsOptional()
    @IsString()
    name_japanese?: string;

    @IsOptional()
    @IsString()
    name_vietnamese?: string;

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
    @IsString()
    image_url?: string;

    @IsOptional()
    @IsInt()
    category_id?: number;

    @IsOptional()
    @IsInt()
    region_id?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(5)
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

    // Admin-only fields for approval/rejection
    @IsOptional()
    @IsIn(['pending', 'approved', 'rejected'])
    status?: 'pending' | 'approved' | 'rejected';

    @IsOptional()
    @IsString()
    rejection_reason?: string;
}
