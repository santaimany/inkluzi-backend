import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { NutritionService } from './nutrition.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { NutritionDetailResponseDto } from './dto/nutrition-detail-response.dto';
import { Roles } from 'src/features/auth/decorators/roles.decorators';

@ApiTags('Nutrition')
@Controller('nutrition')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('menus/:id')
  @Roles('sppg', 'sekolah')
  @ApiOperation({
    summary: 'Dapatkan detail nutrisi lengkap menu',
    description: `
      Endpoint ini mengembalikan informasi nutrisi lengkap dari sebuah menu, termasuk:
      - Info nutrisi (total kalori, total porsi, donut chart)
      - Persentase AKG (Angka Kecukupan Gizi) untuk setiap nutrisi
      - Detail nutrisi per komponen menu (nasi, lauk, sayur, dll)
      - Informasi tentang AKG dan fungsinya
      
      **Akses:**
      - SPPG: Dapat melihat detail nutrisi menu yang mereka buat
      - Sekolah: Dapat melihat detail nutrisi menu yang ditugaskan ke mereka
      
      **Caching:**
      Data akan di-generate sekali menggunakan AI, lalu disimpan di database.
      Request berikutnya akan mengambil data dari cache untuk performa lebih cepat.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID menu (UUID)',
    example: 'b3f43dcb-3ffe-4db5-befa-d97e0d738816',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail nutrisi berhasil diambil',
    type: NutritionDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Menu tidak ditemukan',
    schema: {
      example: {
        statusCode: 404,
        message: 'Menu tidak ditemukan',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Tidak memiliki akses ke menu ini',
    schema: {
      example: {
        statusCode: 403,
        message: 'Menu ini tidak ditugaskan ke sekolah Anda',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid atau tidak ada',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Gagal generate detail nutrisi',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to generate nutrition detail',
        error: 'Internal Server Error',
      },
    },
  })
  async getNutritionDetail(
    @Param('id') menuId: string,
    @Request() req,
  ): Promise<NutritionDetailResponseDto> {
    return this.nutritionService.getNutritionDetail(
      menuId,
      req.user.userId,
      req.user.role,
    );
  }
}