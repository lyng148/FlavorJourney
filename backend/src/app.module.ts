import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileModule } from './profile/profile.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [ProfileModule, PrismaModule, CommonModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
