import { Controller, Get } from '@nestjs/common';
import { RegionService } from './region.service';

@Controller('regions')
export class RegionController {
  constructor(private readonly regionsService: RegionService) {}

  @Get()
  getRegions() {
    return this.regionsService.getRegions();
  }
}
