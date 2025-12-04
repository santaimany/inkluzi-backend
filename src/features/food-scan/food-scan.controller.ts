import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FoodScanService } from './food-scan.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/features/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/features/auth/guards/roles.guard';
import { Roles } from 'src/features/auth/decorators/roles.decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { SaveScanResultDto } from './dto/save-scan-result.dto';
import { GetScanHistoryQueryDto } from './dto/get-scan-history-query.dto';

@ApiTags('Food Scan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('sekolah')
@Controller('school')
export class FoodScanController {
  constructor(private readonly foodScanService: FoodScanService) {}

  @Post('food-scans')
  @ApiOperation({
    summary: 'Scan makanan dengan AI (belum tersimpan)',
    description:
      'Upload foto makanan untuk analisis. Hasil bisa di-review dan edit sebelum disimpan.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'File gambar makanan (JPG/PNG, max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Makanan berhasil di-scan (belum tersimpan)',
  })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|jpg)$/)) {
          return cb(
            new BadRequestException('Hanya file JPG/PNG yang diperbolehkan'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async scanFood(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File gambar diperlukan');
    }

    return this.foodScanService.analyzeFoodOnly(req.user.userId, file);
  }

  @Post('food-scans/save')
  @ApiOperation({
    summary: 'Simpan hasil scan yang sudah di-review',
    description:
      'Simpan hasil analisis makanan ke database setelah user review/edit',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'image_url',
        'cloudinary_public_id',
        'nama_makanan',
        'komponen_menu',
        'kandungan_gizi',
      ],
      properties: {
        image_url: { type: 'string' },
        cloudinary_public_id: { type: 'string' },
        nama_makanan: { type: 'string' },
        komponen_menu: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nama: { type: 'string' },
              porsi: { type: 'string' },
            },
          },
        },
        kandungan_gizi: {
          type: 'object',
          properties: {
            kalori_total: { type: 'number' },
            karbohidrat: { type: 'number' },
            protein: { type: 'number' },
            lemak: { type: 'number' },
            gula: { type: 'number' },
            serat: { type: 'number' },
            sodium: { type: 'number' },
          },
        },
        deteksi_risiko: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        rekomendasi: { type: 'string', nullable: true },
        ml_confidence: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Hasil scan berhasil disimpan',
  })
  async saveScanResult(@Request() req, @Body() dto: SaveScanResultDto) {
    return this.foodScanService.saveScanResult(req.user.userId, dto);
  }

 
  @Get('food-scans')
  @ApiOperation({
    summary: 'Get riwayat scan makanan',
    description: 'Dapatkan daftar riwayat scan makanan dengan pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Halaman yang ingin diambil (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Jumlah data per halaman (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Riwayat scan berhasil diambil',
    schema: {
      example: {
        success: true,
        message: 'Riwayat scan berhasil diambil',
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            image_url: 'https://res.cloudinary.com/xxx/food-scans/abc.jpg',
            nama_makanan: 'Nasi Goreng',
            kandungan_gizi: {
              kalori_total: 520,
              karbohidrat: 78,
              protein: 15,
              lemak: 16,
              gula: 4,
              serat: 2,
              sodium: 950,
            },
            scanned_at: '2025-11-30T10:30:00.000Z',
          },
        ],
        meta: {
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
        },
      },
    },
  })
  async getScanHistory(
    @Request() req,
    @Query() query: GetScanHistoryQueryDto,
  ) {
    return this.foodScanService.getScanHistory(req.user.userId, query);
  }


  @Get('food-scans/:scan_id')
  @ApiOperation({
    summary: 'Get detail hasil scan',
    description: 'Dapatkan detail lengkap hasil scan makanan termasuk komponen menu dan deteksi risiko',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail scan berhasil diambil',
    schema: {
      example: {
        success: true,
        message: 'Detail scan berhasil diambil',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          image_url: 'https://res.cloudinary.com/xxx/food-scans/abc.jpg',
          nama_makanan: 'Nasi Goreng',
          komponen_menu: [
            { nama: 'Nasi Goreng', porsi: '250 g' },
            { nama: 'Telur', porsi: '50 g' },
          ],
          kandungan_gizi: {
            kalori_total: 520,
            karbohidrat: 78,
            protein: 15,
            lemak: 16,
            gula: 4,
            serat: 2,
            sodium: 950,
          },
          deteksi_risiko: {
            nutrisi: ['Sodium tinggi 950mg per porsi'],
          },
          rekomendasi: 'Kurangi penggunaan garam',
          ml_confidence: 88,
          scanned_at: '2025-11-30T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Hasil scan tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Anda tidak memiliki akses ke scan ini' })
  async getScanDetail(
    @Request() req,
    @Param('scan_id', ParseUUIDPipe) scanId: string,
  ) {
    return this.foodScanService.getScanDetail(req.user.userId, scanId);
  }


  @Delete('food-scans/:scan_id')
  @ApiOperation({
    summary: 'Hapus hasil scan',
    description: 'Hapus hasil scan makanan dari database dan Cloudinary',
  })
  @ApiResponse({
    status: 200,
    description: 'Hasil scan berhasil dihapus',
    schema: {
      example: {
        success: true,
        message: 'Hasil scan berhasil dihapus',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Hasil scan tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Anda tidak memiliki akses ke scan ini' })
  async deleteScan(
    @Request() req,
    @Param('scan_id', ParseUUIDPipe) scanId: string,
  ) {
    return this.foodScanService.deleteScan(req.user.userId, scanId);
  }
}