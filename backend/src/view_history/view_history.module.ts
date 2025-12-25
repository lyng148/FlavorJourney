import { Module } from '@nestjs/common';
import { ViewHistoryService } from './view_history.service';
import { ViewHistoryController } from './view_history.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [ViewHistoryController],
  imports: [PrismaModule],
  providers: [ViewHistoryService],
})
export class ViewHistoryModule { }
