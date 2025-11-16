import { Test, TestingModule } from '@nestjs/testing';
import { ViewHistoryService } from './view_history.service';

describe('ViewHistoryService', () => {
  let service: ViewHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ViewHistoryService],
    }).compile();

    service = module.get<ViewHistoryService>(ViewHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
