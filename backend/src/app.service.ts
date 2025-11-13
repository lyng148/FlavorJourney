import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) { }
  
  getHello(): string {
    return 'Hello World!';
  }

  getAllDishes() {
    return this.prismaService.dishes.findMany();
  }
}
