import { BadRequestException, Body, Controller, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FoodScanService } from './food-scan.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { SaveScanResultDto } from './dto/save-scan-result.dto';

@ApiTags('Food Scan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('sekolah')
@Controller('school')
export class FoodScanController {
  constructor(private readonly foodScanService: FoodScanService) {
  }


@Post('food-scans')
@ApiOperation({ 
  summary: 'Scan makanan dengan AI (belum tersimpan)',
  description: 'Upload foto makanan untuk analisis. Hasil bisa di-review dan edit sebelum disimpan.'
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
      if(!file.mimetype.match(/^image\/(jpeg|png|jpg)$/)) {
        return cb(
          new BadRequestException('Hanya file JPG/PNG yang diperbolehkan'),
          false
        )
      }
      cb(null, true);
    }
  })
)
async scanFood(
  @Request() req,
  @UploadedFile() file: Express.Multer.File
) {
  if (!file) {
    throw new BadRequestException('File gambar diperlukan');
  }

  return this.foodScanService.analyzeFoodOnly(req.user.userId, file);
}

@Post('food-scans/save')
@ApiOperation({ 
  summary: 'Simpan hasil scan yang sudah di-review',
  description: 'Simpan hasil analisis makanan ke database setelah user review/edit'
})
@ApiBody({
  schema: {
    type: 'object',
    required: ['image_url', 'cloudinary_public_id', 'nama_makanan', 'komponen_menu', 'kandungan_gizi'],
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
            porsi: { type: 'string' }
          }
        }
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
          sodium: { type: 'number' }
        }
      },
      deteksi_risiko: { 
        type: 'object',
        additionalProperties: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      rekomendasi: { type: 'string', nullable: true },
      ml_confidence: { type: 'number' }
    }
  }
})
@ApiResponse({ 
  status: 201, 
  description: 'Hasil scan berhasil disimpan',
})
async saveScanResult(
  @Request() req,
  @Body() dto: SaveScanResultDto
) {
  return this.foodScanService.saveScanResult(req.user.userId, dto);
}
}
