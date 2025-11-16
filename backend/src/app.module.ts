import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileModule } from './profile/profile.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { DishModule } from './dish/dish.module';
import { ViewHistoryModule } from './view_history/view_history.module';

@Module({
  imports: [ProfileModule, PrismaModule, CommonModule, AuthModule, DishModule, ViewHistoryModule],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
