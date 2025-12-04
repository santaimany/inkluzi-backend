import {
  Controller,
  Get,
  Put,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SppgReportsService } from './sppg-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetReportsQueryDto } from './dto/get-reports-query.dto';
import { RespondReportDto } from './dto/respond-report.dto';
import { Roles } from 'src/auth/decorators/roles.decorators';

@ApiTags('SPPG Reports')
@ApiBearerAuth()
@Controller('sppg/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('sppg')
export class SppgReportsController {
  constructor(private readonly sppgReportsService: SppgReportsService) {}

  // GET LIST REPORTS
  @Get()
  @ApiOperation({
    summary: 'Dapatkan daftar laporan dari sekolah',
    description: 'SPPG dapat melihat semua laporan yang masuk dari sekolah-sekolah yang terassign',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Nomor halaman',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Jumlah data per halaman',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['processing', 'completed'],
    description: 'Filter berdasarkan status',
  })
  @ApiQuery({
    name: 'school_id',
    required: false,
    description: 'Filter berdasarkan ID sekolah',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar laporan berhasil diambil',
    schema: {
      example: {
        success: true,
        message: 'Operation successful',
        data: [
          {
            id: '497f6eca-6276-4993-bfeb-53cbbbba6f08',
            menu_name: 'Menu Sehat Bergizi',
            school_name: 'SDN 01 Jakarta',
            status: 'processing',
            created_at: '2025-12-03T14:15:22.123Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 100,
          total_pages: 10,
        },
      },
    },
  })
  async getReports(@Req() req, @Query() query: GetReportsQueryDto) {
    return this.sppgReportsService.getReports(req.user.userId, query);
  }

  // GET DETAIL REPORT
  @Get(':report_id')
  @ApiOperation({
    summary: 'Lihat detail laporan dari sekolah',
    description: 'SPPG dapat melihat detail lengkap laporan termasuk foto, catatan, dan informasi sekolah',
  })
  @ApiParam({
    name: 'report_id',
    description: 'UUID dari laporan',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail laporan berhasil diambil',
    schema: {
      example: {
        success: true,
        message: 'Operation successful',
        data: {
          id: '497f6eca-6276-4993-bfeb-53cbbbba6f08',
          sekolah: {
            id: 'abc-123',
            nama_sekolah: 'SDN 01 Jakarta',
            npsn: '12345678',
            penanggung_jawab: 'Budi Santoso',
            nomor_kontak: '081234567890',
            jenis_disabilitas: [
              {
                jenis: 'Autisme',
                jumlah_siswa: 5,
              },
              {
                jenis: 'Tunarungu',
                jumlah_siswa: 3,
              },
            ],
          },
          menu: {
            id: 'menu-123',
            nama_menu: 'Menu Sehat Bergizi',
            tanggal_disajikan: '2025-12-03',
          },
          laporan: {
            foto_menu: 'https://cloudinary.com/image.jpg',
            catatan: 'Menu yang disajikan mengandung seafood yang dapat memicu alergi pada beberapa siswa dengan autisme',
            status: 'processing',
            created_at: '2025-12-03T14:15:22.123Z',
          },
          respon_sppg: {
            response: null,
            responded_at: null,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Laporan tidak ditemukan',
  })
  @ApiResponse({
    status: 403,
    description: 'Anda tidak memiliki akses ke laporan ini',
  })
  async getReportDetail(
    @Req() req,
    @Param('report_id', new ParseUUIDPipe({ version: '4' })) reportId: string,
  ) {
    return this.sppgReportsService.getReportDetail(req.user.userId, reportId);
  }

  // RESPOND TO REPORT
  @Put(':report_id')
  @ApiOperation({
    summary: 'Tanggapi laporan dari sekolah',
    description: 'SPPG dapat memberikan respon terhadap laporan (opsional) dan mengubah status menjadi completed',
  })
  @ApiParam({
    name: 'report_id',
    description: 'UUID dari laporan',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Laporan berhasil ditanggapi',
    schema: {
      example: {
        success: true,
        message: 'Laporan berhasil ditanggapi',
        data: {
          report_id: '497f6eca-6276-4993-bfeb-53cbbbba6f08',
          status: 'completed',
          sppg_response: 'Terima kasih atas laporannya. Kami akan segera melakukan perbaikan.',
          responded_at: '2025-12-03T15:30:00.123Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Laporan tidak ditemukan',
  })
  @ApiResponse({
    status: 403,
    description: 'Anda tidak memiliki akses ke laporan ini',
  })
  async respondToReport(
    @Req() req,
    @Param('report_id', new ParseUUIDPipe({ version: '4' })) reportId: string,
    @Body() dto: RespondReportDto,
  ) {
    return this.sppgReportsService.respondToReport(
      req.user.userId,
      reportId,
      dto,
    );
  }
}