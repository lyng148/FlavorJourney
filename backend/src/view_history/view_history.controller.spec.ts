import { Test, TestingModule } from '@nestjs/testing';
import { ViewHistoryController } from './view_history.controller';
import { ViewHistoryService } from './view_history.service';

describe('ViewHistoryController', () => {
  let controller: ViewHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ViewHistoryController],
      providers: [ViewHistoryService],
    }).compile();

    controller = module.get<ViewHistoryController>(ViewHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
