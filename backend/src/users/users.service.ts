import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dtos/change-password.dto'; // Reuse DTO

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async getUserStatistics(userId: number, lang: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { 
        consecutive_login_days: true,
        registration_date: true 
      },
    });

    if (!user) {
      throw new NotFoundException(await this.i18n.translate('user.error.user_not_found', { lang }));
    }

    const totalViews = await this.prisma.view_history.count({
      where: { user_id: userId },
    });

    const totalFavorites = await this.prisma.favorites.count({
      where: { user_id: userId },
    });
    
    const totalSearches = totalViews; 

    return {
      total_searches: totalSearches,
      total_views: totalViews,
      total_favorites: totalFavorites,
      consecutive_login_days: user.consecutive_login_days || 0,
      member_since: user.registration_date,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto, lang: string) {
    const { oldPassword, password, confirmPassword } = dto;
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    
    if (!user) {  
      throw new NotFoundException(
        await this.i18n.translate('user.error.user_not_found', { lang })
      );
    } 

    if (password !== confirmPassword) {
      throw new BadRequestException(
        await this.i18n.translate('user.password.mismatch', { lang })
      );
    }

    if (oldPassword === password) {
      throw new BadRequestException(
        await this.i18n.translate('user.password.same_as_old', { lang })
      );
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException(
        await this.i18n.translate('user.password.old_invalid', { lang })
      );
    }
    const newHashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: {
        password: newHashedPassword,
        token_version: { increment: 1 }, 
      },
    });

    return { 
        message: await this.i18n.translate('user.password.change_success', { lang })
    };
  }
}