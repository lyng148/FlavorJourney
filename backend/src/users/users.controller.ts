import { Body, Controller, Get, Patch, UseGuards, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { I18nLang } from 'nestjs-i18n'; 

@Controller('users')
@UseGuards(JwtAuthGuard) 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('statistics')
  async getUserStatistics(
    @Req() req: any,
    @I18nLang() lang: string,
  ) {
    const userId = req.user.id;
    return this.usersService.getUserStatistics(userId, lang);
  }

  @Patch('change-password')
  @UsePipes(new ValidationPipe({ transform: true }))
  async changePassword(
    @Req() req: any,
    @Body() dto: ChangePasswordDto,
    @I18nLang() lang: string,
  ) {
    const userId = req.user.id;
    return this.usersService.changePassword(userId, dto, lang);
  }
}