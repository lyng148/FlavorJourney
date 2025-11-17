import {
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { I18nLang, I18nService } from 'nestjs-i18n';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly i18n: I18nService,
  ) {}
  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const user = req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException(
        await this.i18n.t('auth.errors.user_info_missing'),
      );
    }
    return this.authService.logout(user.id, user.tv);
  }

  @Post('forgot-password')
  @UsePipes(new ValidationPipe({ transform: true }))
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @I18nLang() lang: string, 
  ) {
    return this.authService.forgotPassword(forgotPasswordDto, lang);
  }

  @Post('reset-password')
  @UsePipes(new ValidationPipe({ transform: true }))
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @I18nLang() lang: string,
  ) {
    return this.authService.resetPassword(resetPasswordDto, lang);
  }
}
