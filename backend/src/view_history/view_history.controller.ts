import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, Query, UseGuards, Req } from '@nestjs/common';
import { ViewHistoryService } from './view_history.service';
import { User } from '../common/types/user';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SaveViewHistoryRequestDto } from './dtos/save-view-history.request.dto';
import { ViewHistoryResponseDto, RecentViewHistoryResponseDto } from './dtos/view-history.response.dto';
import { log } from 'console';

@Controller('view-history')
export class ViewHistoryController {
  constructor(private readonly viewHistoryService: ViewHistoryService) { }

  /**
   * API 34: POST /api/view-history
   * Save view history when user views a dish detail
   * Automatically saves when user views dish detail page, updates view_count
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async saveViewHistory(
    @Req() req,
    @Body() saveViewHistoryRequestDto: SaveViewHistoryRequestDto
  ): Promise<ViewHistoryResponseDto> {
    const user = req.user;
    log('Saving view history for user:', user.id, 'with data:', saveViewHistoryRequestDto);
    return this.viewHistoryService.saveViewHistory(user.id, saveViewHistoryRequestDto);
  }

  /**
   * API 35: GET /api/view-history/{userId}/recent?limit=10
   * Get recent view history for a user
   * Displays dishes user has recently viewed (sorted by viewed_at DESC)
   */
  @Get(':userId/recent')
  async getRecentViewHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: string
  ): Promise<RecentViewHistoryResponseDto> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.viewHistoryService.getRecentViewHistory(userId, parsedLimit);
  }

  /**
   * API 36: DELETE /api/view-history
   * Delete all view history for the current user
   */
  @Delete()
  @UseGuards(JwtAuthGuard)
  async deleteAllViewHistory(
    @CurrentUser() user: User
  ): Promise<{ message: string; deletedCount: number }> {
    return this.viewHistoryService.deleteAllViewHistory(user.sub);
  }
}
