import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { UserRole } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

    if (lastLogin) {
      const diffTime = Math.abs(now.getTime() - lastLogin.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        consecutiveLoginDays += 1;
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
}
