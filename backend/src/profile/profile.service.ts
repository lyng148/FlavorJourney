import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Dish, ProfileResponseDto } from './dtos/profile.response.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly i18n: I18nService,
  ) {}
  async getProfile(id: number): Promise<ProfileResponseDto> {
    // Logic to retrieve profile information by id
    const profile = await this.prismaService.users.findUnique({
      where: { id: id },
      include: {
        favorites: {
          include: { dish: { include: { category: true, region: true } } },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException(
        await this.i18n.t('profile.errors.user_not_found'),
      );
    }

    // Map the retrieved data to ProfileResponseDto
    const profileResponseDto = this.mapProfileToDto(profile);

    return profileResponseDto;
  }

  async editProfile(profileEditRequestDto: any): Promise<ProfileResponseDto> {
    // Logic to edit profile information
    const { id, location, birthday, email, avatar_url } = profileEditRequestDto;

    const updateData: any = {};
    if (location !== undefined) updateData.location = location;
    if (birthday !== undefined) {
      // If birthday is empty string, set to null; otherwise convert to Date
      updateData.birthday = birthday === '' ? null : new Date(birthday);
    }
    if (email !== undefined) updateData.email = email;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const updatedProfile = await this.prismaService.users.update({
      where: { id },
      data: updateData,
      include: {
        favorites: {
          include: { dish: { include: { category: true, region: true } } },
        },
      },
    });

    // Map the updated data to ProfileResponseDto
    return this.mapProfileToDto(updatedProfile);
  }

  mapProfileToDto(profile: any): ProfileResponseDto {
    const dto = new ProfileResponseDto();
    dto.id = profile.id;
    dto.email = profile.email;
    dto.username = profile.username;
    dto.birthday = profile.birthday;
    dto.location = profile.location;
    dto.avatar_url = profile.avatar_url;
    dto.registration_date = profile.registration_date;
    dto.consecutive_login_days = profile.consecutive_login_days;
    const favoritedDishes = profile.favorites.map((fav: any) => {
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
          slug: fav.dish.category.slug,
        };
      }
      if (fav.dish.region) {
        dishDto.region = {
          id: fav.dish.region.id,
          name_japanese: fav.dish.region.name_japanese,
          name_vietnamese: fav.dish.region.name_vietnamese,
          code: fav.dish.region.code,
        };
      }
      return dishDto;
    });
    dto.favoritedDishes = {
      dishes: favoritedDishes,
      numberOfDishes: favoritedDishes.length,
    };
    return dto;
  }
}
