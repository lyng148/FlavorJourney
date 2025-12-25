import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveViewHistoryRequestDto } from './dtos/save-view-history.request.dto';
import {
  ViewHistoryResponseDto,
  RecentViewHistoryResponseDto,
  ViewHistoryItemDto,
} from './dtos/view-history.response.dto';
import { I18nService } from 'nestjs-i18n';
import { DishStatus } from '@prisma/client';

@Injectable()
export class ViewHistoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * API 34: Save view history when user views a dish detail
   * Also updates the view_count of the dish
   */
  async saveViewHistory(
    userId: number,
    saveViewHistoryRequestDto: SaveViewHistoryRequestDto,
  ): Promise<ViewHistoryResponseDto> {
    const { dish_id } = saveViewHistoryRequestDto;

    // Verify the dish exists
    const dish = await this.prismaService.dishes.findUnique({
      where: { id: dish_id },
      include: { category: true, region: true },
    });

    if (!dish) {
      throw new NotFoundException(
        this.i18n.t('view_history.errors.dish_not_found'),
      );
    }
    if (dish.status !== DishStatus.approved) {
      throw new NotFoundException(
        this.i18n.t('view_history.errors.dish_not_found'),
      );
    }

    // Create or update view history
    const viewHistory = await this.prismaService.view_history.create({
      data: {
        user_id: userId,
        dish_id: dish_id,
        viewed_at: new Date(),
      },
    });

    // Update view_count of the dish
    await this.prismaService.dishes.update({
      where: { id: dish_id },
      data: { view_count: { increment: 1 } },
    });

    // Return the view history with full dish details
    return this.mapViewHistoryToDto(viewHistory, dish);
  }

  /**
   * API 35: Get recent view history for a user
   * Returns dishes viewed by the user, sorted by viewed_at DESC
   */
  async getRecentViewHistory(
    userId: number,
    limit: number = 10,
  ): Promise<RecentViewHistoryResponseDto> {
    // Verify user exists
    const user = await this.prismaService.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.t('view_history.errors.user_not_found'),
      );
    }

    // Get recent view history
    const viewHistories = await this.prismaService.view_history.findMany({
      where: { user_id: userId },
      include: {
        dish: {
          include: {
            category: true,
            region: true,
          },
        },
      },
      orderBy: { viewed_at: 'desc' },
      take: limit,
    });

    // Map to DTOs
    const items: ViewHistoryItemDto[] = viewHistories.map((vh) =>
      this.mapViewHistoryItemToDto(vh),
    );

    return {
      items,
      totalCount: items.length,
    };
  }

  /**
   * API 36: Delete all view history for a user
   */
  async deleteAllViewHistory(
    userId: number,
  ): Promise<{ message: string; deletedCount: number }> {
    // Verify user exists
    const user = await this.prismaService.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(
        await this.i18n.t('view_history.errors.user_not_found'),
      );
    }

    // Delete all view history for this user
    const result = await this.prismaService.view_history.deleteMany({
      where: { user_id: userId },
    });

    return {
      message: await this.i18n.t('view_history.messages.deleted'),
      deletedCount: result.count,
    };
  }

  /**
   * Helper method to map view history to DTO
   */
  private mapViewHistoryToDto(
    viewHistory: any,
    dish: any,
  ): ViewHistoryResponseDto {
    const dto = new ViewHistoryResponseDto();
    dto.id = viewHistory.id;
    dto.user_id = viewHistory.user_id;
    dto.dish_id = viewHistory.dish_id;
    dto.viewed_at = viewHistory.viewed_at;
    dto.dish = {
      id: dish.id,
      name_japanese: dish.name_japanese,
      name_vietnamese: dish.name_vietnamese,
      name_romaji: dish.name_romaji,
      description_japanese: dish.description_japanese,
      description_vietnamese: dish.description_vietnamese,
      description_romaji: dish.description_romaji,
      image_url: dish.image_url,
      view_count: dish.view_count,
      category: dish.category
        ? {
            id: dish.category.id,
            name_japanese: dish.category.name_japanese,
            name_vietnamese: dish.category.name_vietnamese,
            slug: dish.category.slug,
          }
        : undefined,
      region: dish.region
        ? {
            id: dish.region.id,
            name_japanese: dish.region.name_japanese,
            name_vietnamese: dish.region.name_vietnamese,
            code: dish.region.code,
          }
        : undefined,
    };
    return dto;
  }

  /**
   * Helper method to map view history item to DTO for recent list
   */
  private mapViewHistoryItemToDto(viewHistory: any): ViewHistoryItemDto {
    const dto = new ViewHistoryItemDto();
    dto.id = viewHistory.id;
    dto.user_id = viewHistory.user_id;
    dto.dish_id = viewHistory.dish_id;
    dto.viewed_at = viewHistory.viewed_at;
    dto.dish = {
      id: viewHistory.dish.id,
      name_japanese: viewHistory.dish.name_japanese,
      name_vietnamese: viewHistory.dish.name_vietnamese,
      name_romaji: viewHistory.dish.name_romaji,
      description_japanese: viewHistory.dish.description_japanese,
      description_vietnamese: viewHistory.dish.description_vietnamese,
      description_romaji: viewHistory.dish.description_romaji,
      image_url: viewHistory.dish.image_url,
      view_count: viewHistory.dish.view_count,
      category: viewHistory.dish.category
        ? {
            id: viewHistory.dish.category.id,
            name_japanese: viewHistory.dish.category.name_japanese,
            name_vietnamese: viewHistory.dish.category.name_vietnamese,
            slug: viewHistory.dish.category.slug,
          }
        : undefined,
      region: viewHistory.dish.region
        ? {
            id: viewHistory.dish.region.id,
            name_japanese: viewHistory.dish.region.name_japanese,
            name_vietnamese: viewHistory.dish.region.name_vietnamese,
            code: viewHistory.dish.region.code,
          }
        : undefined,
    };
    return dto;
  }
}
