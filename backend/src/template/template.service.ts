import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { GenerateTemplateDto } from './dtos/generate-template.dto';

@Injectable()
export class TemplateService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  constructor(private prisma: PrismaService) {}

  async generateIntroduction(dto: GenerateTemplateDto) {
    const { dishId, context } = dto;

    // Lấy thông tin món ăn, thêm ingredients và how_to_eat
    const dish = await this.prisma.dishes.findUnique({
      where: { id: dishId },
      include: { category: true, region: true },
    });

    if (!dish) {
      throw new BadRequestException('Dish not found');
    }

    // Chuẩn hóa các level về thang 5
    const spiciness = dish.spiciness_level ?? 0;
    const saltiness = dish.saltiness_level ?? 0;
    const sweetness = dish.sweetness_level ?? 0;
    const sourness = dish.sourness_level ?? 0;

    // Xây taste description có ghi rõ thang
    const tasteDescription = [
      spiciness ? `辛さ${spiciness}/5` : null,
      saltiness ? `塩味${saltiness}/5` : null,
      sweetness ? `甘さ${sweetness}/5` : null,
      sourness ? `酸味${sourness}/5` : null,
    ]
      .filter(Boolean)
      .join('、');

    // Prompt AI, thêm nguyên liệu và cách ăn
    const prompt = `
あなたはベトナムの学生です。ベトナム料理を日本人の先生に口頭で紹介する文章を作ります。
以下の料理情報と紹介したいシーン(context)をもとに、自然な会話調で作ってください。
※Nếu có nguyên liệu (原材料), cách ăn (食べ方), loại món (カテゴリー) hoặc vùng miền (地域) thì hãy giới thiệu trong câu giới thiệu.

【料理情報】
料理名: ${dish.name_japanese}
カテゴリー: ${dish.category?.name_japanese ?? 'なし'}
地域: ${dish.region?.name_japanese ?? 'なし'}
味の特徴: ${tasteDescription || '特になし'}
説明文: ${dish.description_japanese ?? '説明なし'}
原材料: ${dish.ingredients ?? 'なし'}
食べ方: ${dish.how_to_eat ?? 'なし'}
※各味のレベルは5段階で表しています
${context}

【要件】
- Trả về duy nhất 1 JSON, KHÔNG có ký tự thừa
- JSON structure phải có 2 field: 
{
  "generatedTextJa": "...",
  "generatedTextVi": "..."
}
- 日本語で80〜150文字で自然な会話調
- Tiếng Việt phải dễ hiểu, hấp dẫn, giống đang giới thiệu cho giáo viên
`;

    if (!process.env.OPENAI_API_KEY) {
      throw new BadRequestException('OPENAI_API_KEY is not set');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      let rawOutput = completion.choices?.[0]?.message?.content ?? '';

      const cleanedOutput = rawOutput
        .replace(/^```json\s*/, '')
        .replace(/```$/, '')
        .trim();

      let generatedTexts: { generatedTextJa: string; generatedTextVi: string } =
        {
          generatedTextJa: '',
          generatedTextVi: '',
        };

      try {
        const parsed = JSON.parse(cleanedOutput);
        if (parsed.generatedTextJa && parsed.generatedTextVi) {
          generatedTexts = parsed;
        } else {
          generatedTexts.generatedTextJa = cleanedOutput;
          generatedTexts.generatedTextVi = cleanedOutput;
        }
      } catch {
        generatedTexts.generatedTextJa = cleanedOutput;
        generatedTexts.generatedTextVi = cleanedOutput;
      }

      return {
        dishId: dish.id,
        dishNameJapanese: dish.name_japanese,
        dishNameVietnamese: dish.name_vietnamese,
        category: dish.category
          ? {
              id: dish.category.id,
              name_japanese: dish.category.name_japanese,
              name_vietnamese: dish.category.name_vietnamese,
            }
          : null,
        region: dish.region
          ? {
              id: dish.region.id,
              name_japanese: dish.region.name_japanese,
              name_vietnamese: dish.region.name_vietnamese,
            }
          : null,
        context: context || null,
        tasteDescription: tasteDescription || null,
        ingredients: dish.ingredients || null,
        howToEat: dish.how_to_eat || null,
        generatedTextJa: generatedTexts.generatedTextJa,
        generatedTextVi: generatedTexts.generatedTextVi,
      };
    } catch (err) {
      console.error('OpenAI completion error:', err);
      throw new InternalServerErrorException('Failed to generate introduction');
    }
  }

  // 29: Lưu template
  async saveTemplate(
    userId: number,
    dishId: number,
    generatedTextJa: string,
    generatedTextVi: string,
    title?: string,
    context?: string,
    audioUrl?: string,
  ) {
    if (!dishId || !generatedTextJa || !generatedTextVi) {
      throw new BadRequestException(
        'dishId, generatedTextJa and generatedTextVi are required',
      );
    }

    return this.prisma.saved_templates.create({
      data: {
        user_id: userId,
        dish_id: dishId,
        generated_text_ja: generatedTextJa,
        generated_text_vi: generatedTextVi,
        title: title ?? null,
        context: context ?? null,
        audio_url: audioUrl ?? null,
      },
      include: { dish: true },
    });
  }

  // 30: Lấy template đã lưu của user
  async getSavedTemplates(userId: number) {
    return this.prisma.saved_templates.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        dish: true,
      },
    });
  }

  // 31: Xóa template
  async deleteTemplate(userId: number, templateId: number) {
    const template = await this.prisma.saved_templates.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.user_id !== userId) {
      throw new BadRequestException(
        'You are not allowed to delete this template',
      );
    }

    await this.prisma.saved_templates.delete({
      where: { id: templateId },
    });

    return { message: 'Template deleted successfully' };
  }
}
