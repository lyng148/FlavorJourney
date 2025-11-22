import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  getCategories() {
    return this.prisma.categories.findMany({
      orderBy: { id: 'asc' },
    });
  }
}
