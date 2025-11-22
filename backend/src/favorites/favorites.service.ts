import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFavoriteDto } from './dtos/create-favorite.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class FavoritesService {
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async addFavorite(userId: number, dto: CreateFavoriteDto, lang: string) {
    const { dishId } = dto;

    const dish = await this.prisma.dishes.findUnique({
      where: { id: dishId },
      select: { status: true, id: true },
    });

    if (!dish || dish.status !== 'approved') {
      throw new NotFoundException(await this.i18n.translate('favorite.DISH_NOT_APPROVED', { lang }));
    }

    try {
      const favorite = await this.prisma.favorites.create({
        data: {
          user_id: userId,
          dish_id: dishId,
        },
      });
      return { 
          message: await this.i18n.translate('favorite.ADD_SUCCESS', { lang }),
          favorite 
      };
    } catch (error) {
      if (error.code === 'P2002') { 
        throw new BadRequestException(await this.i18n.translate('favorite.ALREADY_FAVORITED', { lang }));
      }
      throw error;
    }
  }


  async removeFavorite(userId: number, dishId: number, lang: string) {
    try {
      const result = await this.prisma.favorites.deleteMany({
        where: {
          user_id: userId,
          dish_id: dishId,
        },
      });

      if (result.count === 0) {
        throw new NotFoundException(await this.i18n.translate('favorite.NOT_FOUND', { lang }));
      }

      return { message: await this.i18n.translate('favorite.REMOVE_SUCCESS', { lang }) };
    } catch (error) {
        if (error instanceof NotFoundException) {
             throw error;
        }
        throw new BadRequestException(await this.i18n.translate('favorite.DISH_ID_INVALID', { lang })); 
    }
  }
  

  async getFavorites(userId: number) {
    return this.prisma.favorites.findMany({
      where: { user_id: userId },
      select: {
        dish: { 
          include: {
            category: true,
            region: true,  
            users_dishes_submitted_byTousers: { select: { username: true } } 
          },
        },
        created_at: true,
      },
    });
  }

  async checkFavorite(userId: number, dishId: number) {
    const count = await this.prisma.favorites.count({
      where: {
        user_id: userId,
        dish_id: dishId,
      },
    });
    return { isFavorite: count > 0 }; 
  }

  async getFavoriteStatistics(userId: number) {
    const totalFavorites = await this.prisma.favorites.count({
      where: { user_id: userId },
    });

    const spicyFavoritesCount = await this.prisma.favorites.count({
      where: {
        user_id: userId,
        dish: { 
          spiciness_level: { gt: 0 },
        },
      },
    });
    
 
    const regionPopularity = await this.prisma.favorites.groupBy({
      by: ['dish_id'], 
      where: { user_id: userId },
      _count: { dish_id: true },
    }).then(async groups => {
        if (groups.length === 0) return [];
        const dishIds = groups.map(g => g.dish_id);
        
        const dishesWithRegion = await this.prisma.dishes.findMany({
            where: { id: { in: dishIds } },
            select: { 
                region: {
                    select: { name_vietnamese: true } 
                },
                region_id: true 
            }
        });

        const regionStats = dishesWithRegion.reduce((acc, dish) => {
            const regionName = dish.region?.name_vietnamese || 'Không rõ';
            if (regionName) {
                acc[regionName] = (acc[regionName] || 0) + 1;
            }
            return acc;
        }, {});
        
        return Object.keys(regionStats).map(name => ({
            region: name,
            count: regionStats[name],
        })).sort((a, b) => b.count - a.count); 
    });
    
    return {
      total_favorites: totalFavorites,
      spicy_favorites_count: spicyFavoritesCount,
      region_popularity: regionPopularity,
    };
  }
}
