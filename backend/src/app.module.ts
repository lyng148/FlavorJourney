import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileModule } from './profile/profile.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { DishModule } from './dish/dish.module';
import { ViewHistoryModule } from './view_history/view_history.module';
import {
  I18nModule,
  QueryResolver,
  HeaderResolver,
  AcceptLanguageResolver,
} from 'nestjs-i18n';
import { join } from 'path';
import * as fs from 'fs';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'vi',
      loaderOptions: {
        path: join(__dirname, 'locales'),
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ProfileModule,
    PrismaModule,
    CommonModule,
    AuthModule,
    DishModule,
    UploadModule,
    ViewHistoryModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
