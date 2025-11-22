import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegionService {
  constructor(private prisma: PrismaService) {}

  getRegions() {
    return this.prisma.regions.findMany({
      orderBy: { id: 'asc' },
    });
  }
}
