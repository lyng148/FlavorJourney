import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDishDto } from './dtos/create-dish.dto';
import { I18nService } from 'nestjs-i18n';
import { ListDishesQueryDto } from './dtos/list-dish-query.dto';
import {
  DishResponseDto,
  PaginatedDishesResponse,
} from './dtos/list-dish-response.dto';
import { Prisma } from '@prisma/client';
import { UpdateDishDto } from './dtos/update-dish.dto';

@Injectable()
export class DishService {
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async createDish(
    createDishDto: CreateDishDto,
    userId: number,
    imageUrl?: string,
  ) {
    const { category_id, region_id } = createDishDto;

    if (category_id) {
      const category = await this.prisma.categories.findUnique({
        where: { id: category_id },
      });
      if (!category)
        throw new BadRequestException(
          await this.i18n.t('dish.errors.invalid_category'),
        );
    }

    if (region_id) {
      const region = await this.prisma.regions.findUnique({
        where: { id: region_id },
      });
      if (!region)
        throw new BadRequestException(
          await this.i18n.t('dish.errors.invalid_region'),
        );
    }

    if (!createDishDto.name_japanese || !createDishDto.name_vietnamese) {
      throw new BadRequestException(
        await this.i18n.t('dish.errors.name_required'),
      );
    }

    const dish = await this.prisma.dishes.create({
      data: {
        ...createDishDto,
        submitted_by: userId,
        status: 'pending',
        submitted_at: new Date(),
        image_url: imageUrl || null, // thêm trường image_url
      },
      select: {
        id: true,
        name_japanese: true,
        name_vietnamese: true,
        status: true,
        submitted_at: true,
        image_url: true, // trả về URL ảnh luôn
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
    const [regionIds, categoryIds] = await Promise.all([
      query.region?.length
        ? this.prisma.regions
            .findMany({
              where: { code: { in: query.region } },
              select: { id: true },
            })
            .then((r) => r.map((item) => item.id))
        : Promise.resolve(undefined),
      query.category?.length
        ? this.prisma.categories
            .findMany({
              where: { slug: { in: query.category } },
              select: { id: true },
            })
            .then((c) => c.map((item) => item.id))
        : Promise.resolve(undefined),
    ]);

    const dishes = await this.prisma.dishes.findMany({
      where: {
        status: 'approved',

        // Full-text search JP + VI
        ...(query.search && {
          OR: [
            { name_japanese: { contains: query.search } },
            { name_vietnamese: { contains: query.search } },
          ],
        }),

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

    const total = await this.prisma.dishes.count({
      where: {
        status: 'approved',
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
    });
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

  async updateDishSubmission(
    id: number,
    updateDishDto: UpdateDishDto,
    userId: number,
    userRole: string,
  ) {
    // Check if dish exists
    const existingDish = await this.prisma.dishes.findUnique({
      where: { id },
    });

    if (!existingDish) {
      throw new NotFoundException('料理が見つかりません');
    }

    const isAdmin = userRole === 'admin';
    const isOwner = existingDish.submitted_by === userId;

    // Regular users can only update their own pending dishes
    if (!isAdmin) {
      if (!isOwner) {
        throw new ForbiddenException(
          '他のユーザーが提出した料理は更新できません',
        );
      }
      if (existingDish.status !== 'pending') {
        throw new BadRequestException(
          '承認済みまたは却下された料理は更新できません',
        );
      }
      // Regular users cannot change status
      if (updateDishDto.status) {
        throw new ForbiddenException('ステータスを変更する権限がありません');
      }
    }

    // Admin can update any dish, but when changing status, it's a review action
    if (
      isAdmin &&
      updateDishDto.status &&
      updateDishDto.status !== existingDish.status
    ) {
      // If admin is changing status, they are reviewing
      const {
        category_id,
        region_id,
        status,
        rejection_reason,
        ...otherFields
      } = updateDishDto;

      const updateData: any = {
        ...otherFields,
        status,
        reviewed_by: userId,
        reviewed_at: new Date(),
      };

      // Add rejection reason if rejecting
      if (status === 'rejected') {
        if (!rejection_reason) {
          throw new BadRequestException('却下理由が必要です');
        }
        updateData.rejection_reason = rejection_reason;
      } else {
        updateData.rejection_reason = null;
      }

      // Validate category if provided
      if (category_id !== undefined) {
        const category = await this.prisma.categories.findUnique({
          where: { id: category_id },
        });
        if (!category) throw new BadRequestException('カテゴリーが無効です');
        updateData.category_id = category_id;
      }

      // Validate region if provided
      if (region_id !== undefined) {
        const region = await this.prisma.regions.findUnique({
          where: { id: region_id },
        });
        if (!region) throw new BadRequestException('地域が無効です');
        updateData.region_id = region_id;
      }

      const updatedDish = await this.prisma.dishes.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name_japanese: true,
          name_vietnamese: true,
          name_romaji: true,
          description_japanese: true,
          description_vietnamese: true,
          description_romaji: true,
          image_url: true,
          category_id: true,
          region_id: true,
          spiciness_level: true,
          saltiness_level: true,
          sweetness_level: true,
          sourness_level: true,
          ingredients: true,
          how_to_eat: true,
          status: true,
          reviewed_by: true,
          reviewed_at: true,
          rejection_reason: true,
          submitted_at: true,
          updated_at: true,
        },
      });

      return updatedDish;
    }

    // Regular update (not changing status or regular user editing)
    const { category_id, region_id, status, rejection_reason, ...otherFields } =
      updateDishDto;

    // Validate category if provided
    if (category_id !== undefined) {
      const category = await this.prisma.categories.findUnique({
        where: { id: category_id },
      });
      if (!category) throw new BadRequestException('カテゴリーが無効です');
    }

    // Validate region if provided
    if (region_id !== undefined) {
      const region = await this.prisma.regions.findUnique({
        where: { id: region_id },
      });
      if (!region) throw new BadRequestException('地域が無効です');
    }

    const updateData: any = { ...otherFields };
    if (category_id !== undefined) updateData.category_id = category_id;
    if (region_id !== undefined) updateData.region_id = region_id;

    // Update the dish
    const updatedDish = await this.prisma.dishes.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name_japanese: true,
        name_vietnamese: true,
        name_romaji: true,
        description_japanese: true,
        description_vietnamese: true,
        description_romaji: true,
        image_url: true,
        category_id: true,
        region_id: true,
        spiciness_level: true,
        saltiness_level: true,
        sweetness_level: true,
        sourness_level: true,
        ingredients: true,
        how_to_eat: true,
        status: true,
        submitted_at: true,
        updated_at: true,
      },
    });

    return updatedDish;
  }

  async getAllDishSubmissions() {
    const dishes = await this.prisma.dishes.findMany({
      select: {
        id: true,
        name_japanese: true,
        name_vietnamese: true,
        name_romaji: true,
        description_japanese: true,
        description_vietnamese: true,
        description_romaji: true,
        image_url: true,
        category_id: true,
        region_id: true,
        spiciness_level: true,
        saltiness_level: true,
        sweetness_level: true,
        sourness_level: true,
        ingredients: true,
        how_to_eat: true,
        status: true,
        submitted_by: true,
        reviewed_by: true,
        submitted_at: true,
        reviewed_at: true,
        rejection_reason: true,
        category: {
          select: {
            id: true,
            name_japanese: true,
            name_vietnamese: true,
          },
        },
        region: {
          select: {
            id: true,
            name_japanese: true,
            name_vietnamese: true,
          },
        },
        users_dishes_submitted_byTousers: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    return dishes.map((dish) => ({
      ...dish,
      submitter: dish.users_dishes_submitted_byTousers,
      users_dishes_submitted_byTousers: undefined,
    }));
  }

  async getMySubmissions(userId: number) {
    const dishes = await this.prisma.dishes.findMany({
      where: {
        submitted_by: userId,
      },
      select: {
        id: true,
        name_japanese: true,
        name_vietnamese: true,
        name_romaji: true,
        description_japanese: true,
        description_vietnamese: true,
        description_romaji: true,
        image_url: true,
        category_id: true,
        region_id: true,
        spiciness_level: true,
        saltiness_level: true,
        sweetness_level: true,
        sourness_level: true,
        ingredients: true,
        how_to_eat: true,
        status: true,
        submitted_by: true,
        reviewed_by: true,
        submitted_at: true,
        reviewed_at: true,
        rejection_reason: true,
        category: {
          select: {
            id: true,
            name_japanese: true,
            name_vietnamese: true,
          },
        },
        region: {
          select: {
            id: true,
            name_japanese: true,
            name_vietnamese: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });

    return dishes;
  }

  async deleteDishSubmission(id: number, userId: number, userRole: string) {
    // Check if dish exists
    const existingDish = await this.prisma.dishes.findUnique({
      where: { id },
    });

    if (!existingDish) {
      throw new NotFoundException('料理が見つかりません');
    }

    // Only the owner can delete their dish
    if (existingDish.submitted_by !== userId) {
      throw new ForbiddenException(
        '他のユーザーが提出した料理は削除できません',
      );
    }

    // Delete the dish
    await this.prisma.dishes.delete({
      where: { id },
    });

    return {
      message: '料理が正常に削除されました',
      id,
    };
  }

  async getById(dishId: number): Promise<DishResponseDto> {
    const dish = await this.prisma.dishes.findFirst({
      where: { id: dishId, status: 'approved' },
      include: {
        category: true,
        region: true,
        users_dishes_submitted_byTousers: {
          select: { username: true },
        },
      },
    });

    if (!dish) {
      throw new NotFoundException(`指定された料理は見つかりませんでした`);
    }

    return {
      id: dish.id,
      name_japanese: dish.name_japanese,
      name_vietnamese: dish.name_vietnamese,
      name_romaji: dish.name_romaji ?? undefined,
      description_japanese: dish.description_japanese ?? undefined,
      description_vietnamese: dish.description_vietnamese ?? undefined,
      description_romaji: dish.description_romaji ?? undefined,
      image_url: dish.image_url ?? undefined,
      submitted_id: {
        username: dish.users_dishes_submitted_byTousers.username,
      },
      category: dish.category
        ? {
            id: dish.category.id,
            name_japanese: dish.category.name_japanese,
            name_vietnamese: dish.category.name_vietnamese,
          }
        : undefined,
      region: dish.region
        ? {
            id: dish.region.id,
            name_japanese: dish.region.name_japanese,
            name_vietnamese: dish.region.name_vietnamese,
          }
        : undefined,
      spiciness_level: dish.spiciness_level ?? undefined,
      saltiness_level: dish.saltiness_level ?? undefined,
      sweetness_level: dish.sweetness_level ?? undefined,
      sourness_level: dish.sourness_level ?? undefined,
      ingredients: dish.ingredients ?? '',
      how_to_eat: dish.how_to_eat ?? '',
      view_count: dish.view_count ?? 0,
      submitted_at: dish.submitted_at ?? undefined,
      reviewed_at: dish.reviewed_at ?? undefined,
    };
  }
}
