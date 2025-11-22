import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Delete,
  Param,
} from '@nestjs/common';
import { TemplateService } from './template.service';
import { GenerateTemplateDto } from './dtos/generate-template.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate-introduction')
  generateIntroduction(@Body() dto: GenerateTemplateDto) {
    return this.templateService.generateIntroduction(dto);
  }

  // TemplateService
  @UseGuards(JwtAuthGuard)
  @Post('saved-templates')
  async saveTemplate(@Body() body: any, @Req() req) {
    const {
      dishId,
      generatedTextJa,
      generatedTextVi,
      title,
      context,
      audioUrl,
    } = body;

    return this.templateService.saveTemplate(
      req.user.id,
      dishId,
      generatedTextJa,
      generatedTextVi,
      title,
      context,
      audioUrl,
    );
  }

  // 30: Xem template đã lưu của user
  @UseGuards(JwtAuthGuard)
  @Get('saved-templates')
  getSavedTemplates(@Req() req) {
    return this.templateService.getSavedTemplates(req.user.id);
  }

  // 31: Xóa template đã lưu
  @UseGuards(JwtAuthGuard)
  @Delete('saved-templates/:id')
  deleteTemplate(@Param('id') id: string, @Req() req) {
    return this.templateService.deleteTemplate(req.user.id, Number(id));
  }
}
