import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SchoolReportsService } from './school-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { GetReportsQueryDto } from './dto/get-reports-query.dto';
import { Roles } from 'src/auth/decorators/roles.decorators';

@ApiTags('School Reports')
@ApiBearerAuth()
@Controller('school/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('sekolah')
export class SchoolReportsController {
  constructor(private readonly schoolReportsService: SchoolReportsService) {}

  // CREATE REPORT
  @Post()
  @UseInterceptors(FileInterceptor('foto_menu'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Buat laporan menu makanan ke SPPG',
    description:
      'Sekolah dapat melaporkan menu makanan yang bermasalah ke SPPG dengan foto (opsional) dan catatan',
  })
 @ApiBody({
  schema: {
    type: 'object',
    properties: {
      menu_id: {
        type: 'string',
        format: 'uuid',
        description: 'ID menu yang dilaporkan',
        example: '123e4567-e89b-12d3-a456-426614174000',
      },
      catatan: {
        type: 'string',
        description: 'Catatan detail mengenai pelaporan',
        example:
          'Menu mengandung seafood yang memicu alergi pada siswa autisme',
      },
      foto_menu: {
        type: 'string',
        format: 'binary',
        description: 'Foto menu makanan (opsional)',
      },
    },
    required: ['menu_id', 'catatan'], 
  },
})
  @ApiResponse({
    status: 201,
    description: 'Laporan berhasil dibuat',
    schema: {
      example: {
        success: true,
        message: 'Laporan berhasil dikirim ke SPPG',
        data: {
          report_id: '497f6eca-6276-4993-bfeb-53cbbbba6f08',
          menu_name: 'Menu Sehat Bergizi',
          sppg_name: 'SPPG Kota Malang',
          foto_menu: 'https://cloudinary.com/image.jpg',
          catatan:
            'Menu mengandung seafood yang memicu alergi pada siswa autisme',
          status: 'processing',
          created_at: '2025-12-04T14:15:22.123Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Sekolah belum terassign ke SPPG atau menu tidak valid',
  })
  async createReport(
    @Req() req,
    @Body() dto: CreateReportDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.schoolReportsService.createReport(req.user.userId, dto, file);
  }

  // GET LIST REPORTS
  @Get()
  @ApiOperation({
    summary: 'Dapatkan daftar laporan yang pernah dibuat',
    description: 'Sekolah dapat melihat riwayat laporan yang pernah dikirim',
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
            sppg_name: 'SPPG Kota Malang',
            status: 'processing',
            has_response: false,
            created_at: '2025-12-04T14:15:22.123Z',
          },
          {
            id: '597f6eca-6276-4993-bfeb-53cbbbba6f09',
            menu_name: null,
            sppg_name: 'SPPG Kota Malang',
            status: 'completed',
            has_response: true,
            created_at: '2025-12-03T10:20:00.123Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 15,
          total_pages: 2,
        },
      },
    },
  })
  async getReports(@Req() req, @Query() query: GetReportsQueryDto) {
    return this.schoolReportsService.getReports(req.user.userId, query);
  }

  // GET DETAIL REPORT
  @Get(':report_id')
  @ApiOperation({
    summary: 'Lihat detail laporan',
    description:
      'Sekolah dapat melihat detail laporan termasuk respon dari SPPG (jika sudah ada)',
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
          menu: {
            id: 'menu-123',
            nama_menu: 'Menu Sehat Bergizi',
            tanggal_disajikan: '2025-12-03',
          },
          sppg: {
            id: 'sppg-123',
            nama_instansi: 'SPPG Kota Malang',
            penanggung_jawab: 'Dr. Ahmad Subagyo',
            nomor_kontak: '081234567890',
          },
          laporan: {
            foto_menu: 'https://cloudinary.com/image.jpg',
            catatan:
              'Menu mengandung seafood yang memicu alergi pada siswa autisme',
            status: 'completed',
            created_at: '2025-12-04T14:15:22.123Z',
          },
          respon_sppg: {
            response:
              'Terima kasih atas laporannya. Kami akan menghindari seafood pada menu selanjutnya.',
            responded_at: '2025-12-04T16:30:00.123Z',
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
    return this.schoolReportsService.getReportDetail(req.user.userId, reportId);
  }
}