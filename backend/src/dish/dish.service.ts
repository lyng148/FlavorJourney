import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDishDto } from './dtos/create-dish.dto';
import { ListDishesQueryDto } from './dtos/list-dish-query.dto';
import {
  DishResponseDto,
  PaginatedDishesResponse,
} from './dtos/list-dish-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DishService {
  constructor(private prisma: PrismaService) {}

  async createDish(createDishDto: CreateDishDto, userId: number) {
    const { category_id, region_id } = createDishDto;

    // Kiểm tra category tồn tại nếu có
    if (category_id) {
      const category = await this.prisma.categories.findUnique({
        where: { id: category_id },
      });
      if (!category) throw new BadRequestException('カテゴリーが無効です');
    }

    // Kiểm tra region tồn tại nếu có
    if (region_id) {
      const region = await this.prisma.regions.findUnique({
        where: { id: region_id },
      });
      if (!region) throw new BadRequestException('地域が無効です');
    }

    // Kiểm tra tên món ăn
    if (!createDishDto.name_japanese || !createDishDto.name_vietnamese) {
      throw new BadRequestException('料理名は必須です');
    }

    const dish = await this.prisma.dishes.create({
      data: {
        ...createDishDto,
        submitted_by: userId,
        status: 'pending',
        submitted_at: new Date(),
      },
      select: {
        id: true,
        name_japanese: true,
        name_vietnamese: true,
        status: true,
        submitted_at: true,
      },
    });

    return dish;
  }

  async list(query: ListDishesQueryDto): Promise<PaginatedDishesResponse> {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const sortType = query.sort ?? 'latest';

    // ==== Taste filters ====
    const tasteFilters: Prisma.dishesWhereInput[] = [];

    if (query.taste?.includes('spicy')) {
      tasteFilters.push({ spiciness_level: { gte: 5 } });
    }
    if (query.taste?.includes('salty')) {
      tasteFilters.push({ saltiness_level: { gte: 5 } });
    }
    if (query.taste?.includes('sweet')) {
      tasteFilters.push({ sweetness_level: { gte: 5 } });
    }
    if (query.taste?.includes('sour')) {
      tasteFilters.push({ sourness_level: { gte: 5 } });
    }

    const tasteWhere =
      tasteFilters.length > 0 ? { AND: tasteFilters } : undefined;

    // ==== Map region names (code) and category names (slug) to IDs ====
    const regionIds = query.region?.length
      ? (
          await this.prisma.regions.findMany({
            where: { code: { in: query.region } }, // <- sửa region
            select: { id: true },
          })
        ).map((r) => r.id)
      : undefined;

    const categoryIds = query.category?.length
      ? (
          await this.prisma.categories.findMany({
            where: { slug: { in: query.category } }, // <- sửa category
            select: { id: true },
          })
        ).map((c) => c.id)
      : undefined;

    const dishes = await this.prisma.dishes.findMany({
      where: {
        status: 'approved',

        // Full-text search JP + VI
        OR: query.search
          ? [
              { name_japanese: { contains: query.search } },
              { name_vietnamese: { contains: query.search } },
            ]
          : undefined,

        category_id: categoryIds ? { in: categoryIds } : undefined,
        region_id: regionIds ? { in: regionIds } : undefined,

        ...tasteWhere,
      },

      orderBy:
        sortType === 'popular'
          ? { view_count: 'desc' }
          : { reviewed_at: 'desc' },

      skip,
      take: limit,

      include: {
        category: true,
        region: true,
        users_dishes_submitted_byTousers: {
          select: {
            username: true,
          },
        },
      },
    });

    const total = dishes.length;
    const data: DishResponseDto[] = dishes.map((d) => ({
      id: d.id,

      name_japanese: d.name_japanese,
      name_vietnamese: d.name_vietnamese,
      name_romaji: d.name_romaji ?? undefined,

      description_japanese: d.description_japanese ?? undefined,
      description_vietnamese: d.description_vietnamese ?? undefined,
      description_romaji: d.description_romaji ?? undefined,

      image_url: d.image_url ?? undefined,

      submitted_id: {
        username: d.users_dishes_submitted_byTousers.username,
      },

      category: d.category
        ? {
            id: d.category.id,
            name_japanese: d.category.name_japanese,
            name_vietnamese: d.category.name_vietnamese,
          }
        : undefined,

      region: d.region
        ? {
            id: d.region.id,
            name_japanese: d.region.name_japanese,
            name_vietnamese: d.region.name_vietnamese,
          }
        : undefined,

      spiciness_level: d.spiciness_level ?? undefined,
      saltiness_level: d.saltiness_level ?? undefined,
      sweetness_level: d.sweetness_level ?? undefined,
      sourness_level: d.sourness_level ?? undefined,

      ingredients: d.ingredients ?? '',
      how_to_eat: d.how_to_eat ?? '',

      view_count: d.view_count ?? 0,

      submitted_at: d.submitted_at ?? undefined,
      reviewed_at: d.reviewed_at ?? undefined,
    }));

    return {
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
