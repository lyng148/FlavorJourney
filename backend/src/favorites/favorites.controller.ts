import { Body, Controller, Delete, Get, Post, UseGuards, Param, ParseIntPipe, Req } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dtos/create-favorite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { I18nLang } from 'nestjs-i18n';

@Controller('favorites')
@UseGuards(JwtAuthGuard) 
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  async addFavorite(
    @Req() req: any,
    @Body() dto: CreateFavoriteDto,
    @I18nLang() lang: string,
  ) {
    const userId = req.user.id;
    return this.favoritesService.addFavorite(userId, dto, lang);
  }

  @Delete(':dishId')
  async removeFavorite(
    @Req() req: any,
    @Param('dishId', ParseIntPipe) dishId: number,
    @I18nLang() lang: string,
  ) {
    const userId = req.user.id;
    return this.favoritesService.removeFavorite(userId, dishId, lang);
  }

  @Get()
  async getFavorites(@Req() req: any) {
    const userId = req.user.id;
    return this.favoritesService.getFavorites(userId);
  }

  @Get('check/:dishId')
  async checkFavorite(
    @Req() req: any,
    @Param('dishId', ParseIntPipe) dishId: number,
  ) {
    const userId = req.user.id;
    return this.favoritesService.checkFavorite(userId, dishId);
  }

  @Get('statistics')
  async getFavoriteStatistics(@Req() req: any) {
    const userId = req.user.id;
    return this.favoritesService.getFavoriteStatistics(userId);
  }
}