import { Controller, Get,  Body, Patch,  Request, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, BadRequestException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from 'src/features/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from '@nestjs/swagger';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          /* Example of returned profile data */
        }
      }
    }
  })
  async getMyProfile(@Request() req) {
    return await this.profileService.getMyProfile(req.user.userId);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Profile updated successfully',
        data: {
          /* Example of returned profile data */
        }
      }
    }
  })
  @UseInterceptors(FileInterceptor('photo'))
  async updateProfile(
    @Request() req,
    @Body() dto: UpdateProfileDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), 
          new FileTypeValidator({ fileType: /(jpeg|png|jpg)$/ }),
        ],
        fileIsRequired: false,
      })
    )
    photo?: Express.Multer.File,
  ){
    if(typeof dto.disability_types === 'string') {
      try {
        dto.disability_types = JSON.parse(dto.disability_types);
      } catch {
        throw new BadRequestException(
          'Invalid disability_types format. It should be a valid JSON string.'
        )
      }
    }

    const data = await this.profileService.updateMyProfile(
      req.user.userId,
      dto,
      photo,
    )
    return {
      success: true,
      message: 'Profile updated successfully',
      data: data,
    }
  }

}
