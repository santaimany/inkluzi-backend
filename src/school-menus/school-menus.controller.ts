import {
  Controller,
  Get,
  Query,
  Param,
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
import { SchoolMenusService } from './school-menus.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetMenusQueryDto } from './dto/get-menus-query.dto';
import { Roles } from 'src/auth/decorators/roles.decorators';

@ApiTags('School Menus')
@ApiBearerAuth()
@Controller('school/menus')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('sekolah')
export class SchoolMenusController {
  constructor(private readonly schoolMenusService: SchoolMenusService) {}

  // GET LIST MENUS
  @Get()
  @ApiOperation({
    summary: 'Dapatkan daftar menu yang di-assign ke sekolah',
    description: 'Sekolah dapat melihat menu makanan bergizi yang dibuat oleh SPPG untuk mereka',
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
    name: 'month',
    required: false,
    description: 'Filter berdasarkan bulan (format: YYYY-MM)',
    example: '2026-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar menu berhasil diambil',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            tanggal: 'Senin, 12 Januari 2026',
            nama_menu: 'Menu Sehat Bergizi',
            komponen_menu: ['Nasi putih', 'Ikan bakar', 'Sayur bayam'],
            risiko_umum_ringkas: [
              'Ikan - risiko tinggi untuk anak dengan alergi makanan laut',
            ],
            ringkasan_gizi: {
              kalori: '590 kkal',
              protein: '28 g',
              lemak: '14 g',
              serat: '7 g',
            },
            status_keamanan: 'perlu_perhatian',
            nama_sppg: 'SPPG Kota Malang',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 25,
          total_pages: 3,
        },
      },
    },
  })
  async getMenus(@Req() req, @Query() query: GetMenusQueryDto) {
    return this.schoolMenusService.getMenus(req.user.userId, query);
  }

  // GET DETAIL MENU
  @Get(':menu_id')
  @ApiOperation({
    summary: 'Lihat detail menu',
    description: 'Sekolah dapat melihat detail lengkap menu termasuk kandungan gizi dan deteksi risiko. Dari halaman ini sekolah dapat membuat laporan.',
  })
  @ApiParam({
    name: 'menu_id',
    description: 'UUID dari menu',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Detail menu berhasil diambil',
    schema: {
      example: {
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          hari: 'Senin',
          tanggal: 'Senin, 12 Januari 2026',
          nama_menu: 'Menu Sehat Bergizi',
          komponen_menu: [
            { nama: 'Nasi putih', porsi: '150g' },
            { nama: 'Ikan bakar', porsi: '100g' },
            { nama: 'Sayur bayam', porsi: '80g' },
          ],
          kandungan_gizi: [
            { komponen: 'Kalori Total', jumlah: '590 kkal' },
            { komponen: 'Protein', jumlah: '28 g' },
            { komponen: 'Lemak', jumlah: '14 g' },
            { komponen: 'Karbohidrat', jumlah: '85 g' },
            { komponen: 'Serat', jumlah: '7 g' },
            { komponen: 'Gula', jumlah: '5 g' },
            { komponen: 'Natrium', jumlah: '450 mg' },
          ],
          deteksi_risiko: {
            alergi: [
              'Ikan - risiko tinggi untuk anak dengan alergi makanan laut',
            ],
            tekstur: [],
            porsi_gizi: [],
          },
          rekomendasi:
            'Menu sudah cukup seimbang, namun perlu perhatian khusus untuk anak dengan alergi seafood.',
          status_keamanan: 'perlu_perhatian',
          ml_confidence: 0.87,
          catatan_tambahan: null,
          sppg: {
            id: 'sppg-123',
            nama_instansi: 'SPPG Kota Malang',
            penanggung_jawab: 'Dr. Ahmad Subagyo',
            nomor_kontak: '081234567890',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Menu tidak ditemukan atau tidak terassign ke sekolah',
  })
  async getMenuDetail(
    @Req() req,
    @Param('menu_id', new ParseUUIDPipe({ version: '4' })) menuId: string,
  ) {
    return this.schoolMenusService.getMenuDetail(req.user.userId, menuId);
  }
}