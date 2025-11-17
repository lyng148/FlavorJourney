import { DishService } from './dish.service';
import { CreateDishDto } from './dtos/create-dish.dto';
import { ListDishesQueryDto } from './dtos/list-dish-query.dto';
import {
  PaginatedDishesResponse,
  DishResponseDto,
} from './dtos/list-dish-response.dto';
import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Put,
  Param,
  Query,
  Get,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { UpdateDishDto } from './dtos/update-dish.dto';
import { GetAllDishSubmissionsQueryDto } from './dtos/get-all-dish-submissions-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common/decorators';
import { UploadService } from '../upload/upload.service';

@Controller('dishes')
export class DishController {
  constructor(
    private readonly dishService: DishService,
    private readonly uploadService: UploadService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async addDish(
    @Body() createDishDto: CreateDishDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const userId = req.user.id;

    let imageUrl: string | undefined;
    if (file) {
      imageUrl = await this.uploadService.uploadDishImage(file);
    }

    return this.dishService.createDish(createDishDto, userId, imageUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Query() query: ListDishesQueryDto,
  ): Promise<PaginatedDishesResponse> {
    return this.dishService.list(query);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateDishSubmission(
    @Param('id') id: string,
    @Body() updateDishDto: UpdateDishDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const dishId = parseInt(id, 10);
    return this.dishService.updateDishSubmission(
      dishId,
      updateDishDto,
      userId,
      userRole,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/dish-submissions')
  async getAllDishSubmissions(
    @Query() query: GetAllDishSubmissionsQueryDto,
  ): Promise<PaginatedDishesResponse> {
    return this.dishService.getAllDishSubmissions(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-submissions')
  async getMySubmissions(@Req() req) {
    const userId = req.user.id;
    return this.dishService.getMySubmissions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteDishSubmission(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    const dishId = parseInt(id, 10);
    return this.dishService.deleteDishSubmission(dishId, userId, userRole);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':dishId')
  async getDishById(@Param('dishId', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.dishService.getById(id, userId, userRole);
  }
}
