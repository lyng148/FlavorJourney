import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileResponseDto } from './dtos/profile.response.dto';
import { ProfileEditRequestDto } from './dtos/profile-edit.request.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProfileOwnerGuard } from 'src/auth/guards/profile-owner.guard';

@Controller('users/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get(':id')
  getProfile(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, ProfileOwnerGuard)
  editProfile(
    @Body() profileEditRequestDto: ProfileEditRequestDto
  ): Promise<ProfileResponseDto> {
    return this.profileService.editProfile(profileEditRequestDto);
  }
}
