import { Module } from '@nestjs/common';
import { DishController } from './dish.controller';
import { DishService } from './dish.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  controllers: [DishController],
  providers: [DishService],
  imports: [UploadModule],
})
export class DishModule {}
