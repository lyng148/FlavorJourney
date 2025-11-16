import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DishService } from './dish.service';
import { CreateDishDto } from './dtos/create-dish.dto';
import { ListDishesQueryDto } from './dtos/list-dish-query.dto';
import { PaginatedDishesResponse } from './dtos/list-dish-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dishes')
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async addDish(@Body() createDishDto: CreateDishDto, @Req() req) {
    const userId = req.user.id;
    return this.dishService.createDish(createDishDto, userId);
  }

  @Get()
  async list(
    @Query() query: ListDishesQueryDto,
  ): Promise<PaginatedDishesResponse> {
    return this.dishService.list(query);
  }
}
