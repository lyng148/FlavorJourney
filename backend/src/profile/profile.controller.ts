import { Controller, Get, Param } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileResponseDto } from './dtos/profile.response.dto';

@Controller('users/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get(':id')
  getProfile(
    @Param('id') id: number
  ): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(id);
  }
}
