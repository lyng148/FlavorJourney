import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDishDto } from './dtos/create-dish.dto';
import { I18nService } from 'nestjs-i18n';
import { Prisma, DishStatus } from '@prisma/client';
import { ListDishesQueryDto } from './dtos/list-dish-query.dto';
import {
  DishResponseDto,
  PaginatedDishesResponse,
} from './dtos/list-dish-response.dto';
import { UpdateDishDto } from './dtos/update-dish.dto';
import { GetAllDishSubmissionsQueryDto } from './dtos/get-all-dish-submissions-query.dto';

@Injectable()
export class DishService {
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) { }

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
      throw new NotFoundException(
        await this.i18n.t('dish.errors.dish_not_found'),
      );
    }

    const isAdmin = userRole === 'admin';
    const isOwner = existingDish.submitted_by === userId;

    // Regular users can only update their own pending dishes
    if (!isAdmin) {
      if (!isOwner) {
        throw new ForbiddenException(
          await this.i18n.t('dish.errors.cannot_update_others_dish'),
        );
      }
      if (existingDish.status !== 'pending') {
        throw new BadRequestException(
          await this.i18n.t('dish.errors.cannot_update_approved_or_rejected'),
        );
      }
      // Regular users cannot change status
      if (updateDishDto.status) {
        throw new ForbiddenException(
          await this.i18n.t('dish.errors.no_permission_to_change_status'),
        );
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
          throw new BadRequestException(
            await this.i18n.t('dish.errors.rejection_reason_required'),
          );
        }
        updateData.rejection_reason = rejection_reason;
      } else {
        updateData.rejection_reason = null;
      }
      // Add reviewed_by and reviewed_at if approving
      updateData.reviewed_by = userId;
      updateData.reviewed_at = new Date();
      if (status === 'approved') {
        updateData.rejection_reason = null;
        updateData.reviewed_by = userId;
        updateData.reviewed_at = new Date();
      }
      // Validate category if provided
      if (category_id !== undefined) {
        const category = await this.prisma.categories.findUnique({
          where: { id: category_id },
        });
        if (!category) throw new BadRequestException(
          await this.i18n.t('dish.errors.invalid_category'),
        );
        updateData.category_id = category_id;
      }

      // Validate region if provided
      if (region_id !== undefined) {
        const region = await this.prisma.regions.findUnique({
          where: { id: region_id },
        });
        if (!region) throw new BadRequestException(
          await this.i18n.t('dish.errors.invalid_region'),
        );
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
      if (!category) throw new BadRequestException(
        await this.i18n.t('dish.errors.invalid_category'),
      );
    }

    // Validate region if provided
    if (region_id !== undefined) {
      const region = await this.prisma.regions.findUnique({
        where: { id: region_id },
      });
      if (!region) throw new BadRequestException(
        await this.i18n.t('dish.errors.invalid_region'),
      );
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

  async getAllDishSubmissions(query: GetAllDishSubmissionsQueryDto): Promise<PaginatedDishesResponse> {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const dishes = await this.prisma.dishes.findMany({
      where: {
        ...(query.status && { status: query.status as DishStatus }),
      },
      orderBy: {
        submitted_at: 'desc',
      },
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
        ...(query.status && { status: query.status as DishStatus }),
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
        username: (d as any).users_dishes_submitted_byTousers.username,
      },
      category: (d as any).category
        ? {
          id: (d as any).category.id,
          name_japanese: (d as any).category.name_japanese,
          name_vietnamese: (d as any).category.name_vietnamese,
        }
        : undefined,
      region: (d as any).region
        ? {
          id: (d as any).region.id,
          name_japanese: (d as any).region.name_japanese,
          name_vietnamese: (d as any).region.name_vietnamese,
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
      throw new NotFoundException(
        await this.i18n.t('dish.errors.dish_not_found'),
      );
    }

    // Only the owner or admin can delete their dish
    if (existingDish.submitted_by !== userId && userRole !== 'admin') {
      throw new ForbiddenException(
        await this.i18n.t('dish.errors.cannot_delete_others_dish'),
      );
    }

    // Delete the dish
    await this.prisma.dishes.delete({
      where: { id },
    });

    return {
      message: await this.i18n.t('dish.success.dish_deleted_successfully'),
      id,
    };
  }

  async getById(dishId: number, userId: number, userRole: string) {
    const dish = await this.prisma.dishes.findUnique({
      where: { id: dishId },
      include: {
        category: true,
        region: true,
        users_dishes_submitted_byTousers: true,
        users_dishes_reviewed_byTousers: true,
      },
    });

    if (!dish) {
      throw new NotFoundException('指定された料理は見つかりませんでした');
    }

    const isOwner = dish.submitted_by === userId;
    const isAdmin = userRole === 'admin';
    const isApproved = dish.status === 'approved';

    if (!isOwner && !isAdmin && !isApproved) {
      throw new ForbiddenException('この料理を見る権限がありません');
    }

    return dish;
  }
}
