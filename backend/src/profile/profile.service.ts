import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Dish, ProfileResponseDto } from './dtos/profile.response.dto';

@Injectable()
export class ProfileService {
    constructor(private readonly prismaService: PrismaService) { }
    async getProfile(id: number): Promise<ProfileResponseDto> {
        // Logic to retrieve profile information by id
        const profile = await this.prismaService.users.findUnique({
            where: { id: id },
            include: { favorites: { include: { dish: { include: { category: true, region: true } } } } }
        });

        if (!profile) {
            throw new NotFoundException('ユーザーが見つかりません');
        }

        // Map the retrieved data to ProfileResponseDto
        const profileResponseDto = this.mapProfileToDto(profile);

        return profileResponseDto;
    }

    mapProfileToDto(profile: any): ProfileResponseDto {
        const dto = new ProfileResponseDto();
        dto.id = profile.id;
        dto.email = profile.email;
        dto.username = profile.username;
        dto.birthday = profile.birthday;
        dto.location = profile.location;
        dto.registration_date = profile.registration_date;
        const favoritesDishes = profile.favorites.map((fav: any) => {
            const dishDto = new Dish();
            dishDto.id = fav.dish.id;
            dishDto.name_japanese = fav.dish.name_japanese;
            dishDto.name_vietnamese = fav.dish.name_vietnamese;
            dishDto.name_romaji = fav.dish.name_romaji;
            dishDto.description_japanese = fav.dish.description_japanese;
            dishDto.description_vietnamese = fav.dish.description_vietnamese;
            dishDto.description_romaji = fav.dish.description_romaji;
            dishDto.image_url = fav.dish.image_url;
            if (fav.dish.category) {
                dishDto.category = {
                    id: fav.dish.category.id,
                    name_japanese: fav.dish.category.name_japanese,
                    name_vietnamese: fav.dish.category.name_vietnamese,
                    slug: fav.dish.category.slug
                };
            }
            if (fav.dish.region) {
                dishDto.region = {
                    id: fav.dish.region.id,
                    name_japanese: fav.dish.region.name_japanese,
                    name_vietnamese: fav.dish.region.name_vietnamese,
                    code: fav.dish.region.code
                };
            }
            return dishDto;
        });
        dto.favorites = favoritesDishes;
        return dto;
    }
}
