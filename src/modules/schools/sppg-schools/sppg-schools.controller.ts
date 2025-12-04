import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { SppgSchoolsService } from './sppg-schools.service';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { GetSchoolsQueryDto } from './dto/get-schools-quey.dto';

@ApiTags('SPPG Schools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('sppg')
@Controller('sppg/schools')
export class SppgSchoolsController {
  constructor(private readonly sppgSchoolsService: SppgSchoolsService) {
  }

   @Get()
  @ApiOperation({
    summary: 'Get sekolah yang di-assign ke SPPG',
    description: 'Dapatkan daftar sekolah yang di-assign dengan pagination dan search',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Kata kunci pencarian (nama sekolah, NPSN)',
    example: 'SLB',
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
    description: 'Data sekolah berhasil diambil',
    schema: {
      example: {
        success: true,
        message: 'Data sekolah berhasil diambil',
        data: [
          {
            id: 'd80f0873-a8aa-40f6-b429-4307055fdaf9',
            email: 'slb.bogor@gmail.com',
            status: 'active',
            nama_sekolah: 'SLB-B YPTB Bogor',
            npsn: '20240001',
            jenis_sekolah: 'SLB-B',
            alamat: 'Jl. Pajajaran No. 123, Bogor',
            total_siswa: 150,
            penanggung_jawab: 'Budi Santoso',
            nomor_kontak: '081234567890',
            photo_url: 'https://res.cloudinary.com/xxx/schools/abc.jpg',
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
  async getMySchools(@Request() req, @Query() query: GetSchoolsQueryDto) {
    return await this.sppgSchoolsService.getMySchools(req.user.userId, query);
  }

  @Get(':school_id')
  @ApiOperation({
    summary: 'Get detail sekolah',
    description: 'Dapatkan detail lengkap sekolah termasuk jenis disabilitas',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail sekolah berhasil diambil',
    schema: {
      example: {
        success: true,
        message: 'Detail sekolah berhasil diambil',
        data: {
          id: 'd80f0873-a8aa-40f6-b429-4307055fdaf9',
          email: 'slb.bogor@gmail.com',
          status: 'active',
          nama_sekolah: 'SLB-B YPTB Bogor',
          npsn: '20240001',
          jenis_sekolah: 'SLB-B',
          alamat: 'Jl. Pajajaran No. 123, Bogor',
          total_siswa: 150,
          penanggung_jawab: 'Budi Santoso',
          nomor_kontak: '081234567890',
          photo_url: 'https://res.cloudinary.com/xxx/schools/abc.jpg',
          jenis_disabilitas: [
            {
              jenis_disabilitas: 'Tunanetra',
              jumlah_siswa: 50,
            },
            {
              jenis_disabilitas: 'Tunarungu',
              jumlah_siswa: 100,
            },
          ],
          created_at: '2025-11-28T06:22:40.082Z',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Sekolah tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Sekolah tidak di-assign ke SPPG Anda' })
  async getSchoolDetail(@Request() req, @Param('school_id') schoolId: string) {
    return await this.sppgSchoolsService.getSchoolDetail(req.user.userId, schoolId);
  }
}
