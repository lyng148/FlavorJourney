import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma/prisma.service'; 
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@Module({
  imports: [],
  controllers: [FavoritesController],
  providers: [FavoritesService, PrismaService, JwtAuthGuard],
})
export class FavoritesModule {}