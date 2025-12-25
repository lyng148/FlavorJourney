import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [ProfileController],
  imports: [PrismaModule],
  providers: [ProfileService],
})
export class ProfileModule {}
