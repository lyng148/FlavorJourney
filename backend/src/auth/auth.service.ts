import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { UserRole } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { MailerService } from '@nestjs-modules/mailer';


@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private readonly i18n: I18nService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, confirmPassword, birthday, location } =
      registerDto;
    if (password !== confirmPassword) {
      throw new BadRequestException(
        await this.i18n.t('auth.errors.password_mismatch'),
      );
    }

    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException(
        await this.i18n.t('auth.errors.email_in_use'),
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let parsedBirthday: Date | undefined = undefined;
    if (birthday) {
      const d = new Date(birthday as any);
      if (isNaN(d.getTime())) {
        throw new BadRequestException(
          await this.i18n.t('auth.errors.invalid_birthday'),
        );
      }
      parsedBirthday = d;
    }

    const newUser = await this.prisma.users.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: UserRole.user,
        birthday: parsedBirthday,
        location,
        registration_date: new Date(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        registration_date: true,
      },
    });

    return {
      message: await this.i18n.t('auth.register.success'),
      user: newUser,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, saveLoginInfo } = loginDto;

    const user = await this.prisma.users.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException(
        await this.i18n.t('auth.errors.invalid_credentials'),
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        await this.i18n.t('auth.errors.invalid_credentials'),
      );
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      tv: user.token_version ?? 0,
    };

    const now = new Date();
    const lastLogin = user.last_login;
    let consecutiveLoginDays = user.consecutive_login_days || 0;

    const DAY_MS = 1000 * 60 * 60 * 24;
    const startOfDay = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    if (lastLogin) {
      const last = startOfDay(lastLogin);
      const today = startOfDay(now);
      const diffDays = Math.floor((today.getTime() - last.getTime()) / DAY_MS);

      if (diffDays === 1) {
        consecutiveLoginDays += 1;
      } else if (diffDays === 0) {
        // same day: keep streak unchanged
      } else if (diffDays > 1) {
        consecutiveLoginDays = 1;
      }
    } else {
      consecutiveLoginDays = 1;
    }

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        last_login: now,
        consecutive_login_days: consecutiveLoginDays,
        save_login_info: saveLoginInfo,
      },
    });

    const redirectTo = user.role === UserRole.admin ? '/admin' : '/';

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      redirectTo,
    };
  }

  async logout(userId: number, tokenVersionFromToken?: number) {
    if (typeof tokenVersionFromToken === 'number') {
      const updated = await this.prisma.users.updateMany({
        where: { id: userId, token_version: tokenVersionFromToken },
        data: { token_version: tokenVersionFromToken + 1 },
      });
      if (updated.count === 0) {
        const user = await this.prisma.users.findUnique({
          where: { id: userId },
          select: { token_version: true },
        });
        if (!user) {
          throw new NotFoundException(
            await this.i18n.t('auth.errors.user_not_found'),
          );
        }
        if ((user.token_version ?? 0) > tokenVersionFromToken) {
          return {
            message: await this.i18n.t('auth.errors.already_logged_out'),
          };
        }
        const retry = await this.prisma.users.updateMany({
          where: { id: userId, token_version: tokenVersionFromToken },
          data: { token_version: tokenVersionFromToken + 1 },
        });
        if (retry.count === 0) {
          return {
            message: await this.i18n.t('auth.errors.already_logged_out'),
          };
        }
      }
      return { message: await this.i18n.t('auth.errors.logged_out') };
    }
    const result = await this.prisma.users.updateMany({
      where: { id: userId },
      data: { token_version: { increment: 1 } },
    });
    if (result.count === 0) {
      throw new NotFoundException(
        await this.i18n.t('auth.errors.user_not_found'),
      );
    }
    return { message: await this.i18n.t('auth.errors.logged_out') };
  }
  
async forgotPassword(forgotPasswordDto: ForgotPasswordDto, lang: string) {
    const { email } = forgotPasswordDto;
    const user = await this.prisma.users.findUnique({ where: { email } });
    
    if (!user) {
      const successMessage = await this.i18n.translate('auth.email.reset_sent', { lang });
      return { message: successMessage }; 
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 60); 

    try {
        await this.prisma.users.update({
            where: { id: user.id },
            data: {
                reset_password_token: token,
                reset_password_expires_at: expires,
                token_version: { increment: 1 }
            },
        });
    } catch (dbError) {
        console.error('Lỗi DB khi cập nhật reset token:', dbError);
        throw new BadRequestException(await this.i18n.translate('auth.email.send_error', { lang }));
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200'; 
    const resetUrl = `${clientUrl}reset-password?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: await this.i18n.translate('email.PASSWORD_RESET_SUBJECT', { lang }), 
        template: lang === 'jp' ? 'forgot-password-jp' : 'forgot-password-vi',
        context: {
          username: user.username,
          resetUrl: resetUrl, 
          expiresMinutes: 60,
          lang: lang
        },
      });
      
      const successMessage = await this.i18n.translate('auth.email.reset_sent', { lang });
      return { message: successMessage };
    } catch (mailError) {
        console.error('Lỗi khi gửi mail:', mailError);
        throw new BadRequestException(
            await this.i18n.translate('auth.email.send_error', { lang })
        );
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, lang: string) {
    const { token, password, confirmPassword } = resetPasswordDto;

    if (password !== confirmPassword) {
      throw new BadRequestException(
        await this.i18n.translate('auth.errors.password_mismatch', { lang }),
      );
    }

    const user = await this.prisma.users.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires_at: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException(
        await this.i18n.translate('auth.errors.invalid_or_expired_token', { lang }),
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires_at: null,
        token_version: { increment: 1 },
      },
    });

    return {
      message: await this.i18n.translate('auth.reset_password.success', { lang }),
    };
  }
}
