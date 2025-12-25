import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_SECRET environment variable is not set. Please add JWT_SECRET to your .env file.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.users.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const tokenVersionInToken = payload.tv ?? 0;
    const tokenVersionInDb = user.token_version;
    if (tokenVersionInToken !== tokenVersionInDb) {
      throw new UnauthorizedException(
        await this.i18n.t('auth.errors.token_revoked'),
      );
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tv: tokenVersionInToken,
    };
  }
}
