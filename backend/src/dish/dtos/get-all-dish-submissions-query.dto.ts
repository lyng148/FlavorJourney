import { IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { DishStatus } from '@prisma/client';

export class GetAllDishSubmissionsQueryDto {
    @IsOptional()
    @IsEnum(DishStatus)
    status?: DishStatus;

    @IsOptional()
    @IsNumberString()
    page?: string;

    @IsOptional()
    @IsNumberString()
    limit?: string;
}
