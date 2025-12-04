import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SppgMenusService } from './sppg-menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { GetMenusQueryDto } from './dto/get-menus-query.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@ApiTags('SPPG - Menu Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('sppg')
@Controller('sppg/menus')
export class SppgMenusController {
  constructor(private readonly sppgMenusService: SppgMenusService) {}

  @Post()
  @ApiOperation({
    summary: 'Create menu for all assigned schools',
    description:
      'SPPG membuat menu untuk SEMUA sekolah yang di-assign. Menu dianalisis AI menggunakan gabungan disability types dari semua sekolah.',
  })
  @ApiResponse({
    status: 201,
    description: 'Menu berhasil dibuat',
    schema: {
      example: {
        status: 'success',
        message: 'Menu berhasil dibuat dan ditugaskan ke 3 sekolah',
        data: {
          menu_id: '123e4567-e89b-12d3-a456-426614174000',
          tanggal: 'Senin, 12 Januari 2026',
          nama_menu: 'Ikan Bumbu Kuning',
          status_keamanan: 'aman',
          ml_confidence: 92,
          total_sekolah_assigned: 3,
          sekolah_list: [{ school_id: 'uuid-1', nama_sekolah: 'SD Negeri 1' }],
          created_at: '2026-01-10T10:00:00.000Z',
        },
      },
    },
  })
  async createMenu(@Body() dto: CreateMenuDto, @Req() req) {
    const sppgId = req.user.userId;
    return await this.sppgMenusService.createMenu(sppgId, dto);
  }

  @ApiOperation({
    summary: 'Get all menus (My Menus)',
    description:
      'SPPG melihat semua menu yang telah dibuat. Tampilan card dengan info ringkas: nama menu, tanggal, komponen, status keamanan. Filter: school_id (UUID) atau month (YYYY-MM).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'school_id',
    required: false,
    type: String,
    description: 'Filter by school UUID',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: String,
    description: 'Filter by month (YYYY-MM)',
  })
  @ApiResponse({
    status: 200,
    description: 'Data menu berhasil diambil',
    schema: {
      example: {
        status: 'success',
        message: 'Data menu berhasil diambil',
        data: [
          {
            menu_id: '123e4567-e89b-12d3-a456-426614174000',
            nama_menu: 'Ikan Bumbu Kuning',
            tanggal: 'Senin, 12 Januari 2026',
            komponen_menu_ringkas: [
              'Nasi putih',
              'Ikan fillet kuning',
              'Tumis Buncis',
              'Air Putih',
              'Pisang',
            ],
            risiko_umum_ringkas: [
              'Tidak ditemukan risiko signifikan.',
              'Tekstur lembut, relatif aman untuk anak sensitif.',
            ],
            status_keamanan: 'aman',
            total_sekolah: 3,
            created_at: '2026-01-10T10:00:00.000Z',
          },
        ],
        pagination: {
          current_page: 1,
          total_pages: 5,
          total_items: 50,
          items_per_page: 10,
        },
      },
    },
  })
  @Get()
  async getMenus(@Query() query: GetMenusQueryDto, @Req() req) {
    const sppgUserId = req.user.userId;
    return this.sppgMenusService.getMenus(sppgUserId, query);
  }

    @ApiOperation({ 
        summary: 'Get menu detail for SPPG',
        description: 'SPPG melihat detail lengkap menu sesuai design: nama menu, badge hari, badge status, komponen dengan porsi, tabel kandungan gizi lengkap (7 komponen), deteksi risiko per kategori (Alergi, Tekstur, Porsi Gizi), rekomendasi, dan catatan tambahan (warning).'
    })
    @ApiParam({
        name: 'menu_id',
        type: 'string',
        format: 'uuid',
        description: 'Menu ID (UUID)'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Detail menu berhasil diambil',
        schema: {
            example: {
                status: 'success',
                message: 'Detail menu berhasil diambil',
                data: {
                    menu_id: '123e4567-e89b-12d3-a456-426614174000',
                    nama_menu: 'Nasi Ikan Bumbu Kuning',
                    hari: 'Senin',
                    tanggal: 'Senin, 12 Januari 2026',
                    status_keamanan: 'aman',
                    komponen_menu: [
                        { nama: 'Nasi putih', porsi: '150g' },
                        { nama: 'Ikan kuning', porsi: '90g' },
                        { nama: 'Tumis buncis', porsi: '60g' },
                        { nama: 'Air mineral', porsi: '200ml' },
                        { nama: 'Jeruk', porsi: '1 buah' }
                    ],
                    kandungan_gizi: [
                        { komponen: 'Kalori Total', jumlah: '590 kkal' },
                        { komponen: 'Karbohidrat', jumlah: '76g' },
                        { komponen: 'Protein', jumlah: '28g' },
                        { komponen: 'Lemak', jumlah: '14g' },
                        { komponen: 'Gula', jumlah: '10g' },
                        { komponen: 'Serat', jumlah: '7g' },
                        { komponen: 'Sodium', jumlah: '680mg' }
                    ],
                    deteksi_risiko: {
                        alergi: ['Tidak ada bahan dengan potensi alergi tinggi.'],
                        tekstur: ['Ikan empuk → aman untuk siswa sensitif tekstur.'],
                        porsi_gizi: ['Semua porsi gizi berada dalam rentang standar MBG.']
                    },
                    rekomendasi: 'Tidak memerlukan tindakan khusus, menu aman untuk semua kelompok siswa.',
                    catatan_tambahan: 'Ada peningkatan konsumsi gula berlebih pada 3 hari terakhir. Kurangi konsumsi manis dari menu.',
                    ml_confidence: 92,
                    disability_types_covered: ['Autisme', 'ADHD', 'Tunadaksa'],
                    assigned_schools: [
                        {
                            school_id: 'uuid-1',
                            nama_sekolah: 'SD Negeri 1 Jakarta',
                            disability_types: ['Autisme', 'ADHD']
                        }
                    ],
                    created_at: '2026-01-10T10:00:00.000Z',
                    updated_at: '2026-01-10T10:00:00.000Z'
                }
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Menu tidak ditemukan'
    })
    @ApiResponse({ 
        status: 403, 
        description: 'Forbidden - SPPG tidak memiliki akses ke menu ini'
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Bad Request - UUID tidak valid'
    })
    @Get(':menu_id')
    async getMenuDetail(
        @Param('menu_id', new ParseUUIDPipe({ version: '4' })) menuId: string,
        @Req() req,
    ) {
        const sppgUserId = req.user.userId;
        return this.sppgMenusService.getMenuDetail(sppgUserId, menuId);
    }


    @ApiOperation({ 
        summary: 'Delete menu',
        description: 'SPPG menghapus menu dari database. Menu akan dihapus dari SEMUA sekolah yang di-assign. MenuAssignment akan cascade delete otomatis.'
    })
    @ApiParam({
        name: 'menu_id',
        type: 'string',
        format: 'uuid',
        description: 'Menu ID (UUID)'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Menu berhasil dihapus',
        schema: {
            example: {
                status: 'success',
                message: 'Menu berhasil dihapus dari 3 sekolah'
            }
        }
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Menu tidak ditemukan'
    })
    @ApiResponse({ 
        status: 403, 
        description: 'Forbidden - SPPG tidak memiliki akses ke menu ini'
    })
    @ApiResponse({ 
        status: 400, 
        description: 'Bad Request - UUID tidak valid'
    })
    @Delete(':menu_id')
    async deleteMenu(@Param('menu_id', new ParseUUIDPipe({ version: '4' })) menuId: string, @Req() req){
      const sppgUserId = req.user.userId;
      return this.sppgMenusService.deleteMenu(sppgUserId, menuId);
    }

    @Put(':menu_id')
@ApiOperation({
  summary: 'Update menu untuk semua sekolah yang terassign',
  description: 'SPPG dapat mengubah menu yang sudah dibuat. Jika komponen atau nama menu diubah, akan di-analyze ulang dengan AI',
})
@ApiParam({
  name: 'menu_id',
  description: 'UUID dari menu yang akan diupdate',
  example: '123e4567-e89b-12d3-a456-426614174000',
})
@ApiResponse({
  status: 200,
  description: 'Menu berhasil diperbarui',
  schema: {
    example: {
      message: 'Menu berhasil diperbarui untuk semua sekolah yang terassign',
      data: {
        menu_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal: 'Senin, 12 Januari 2026',
        nama_menu: 'Menu Sehat Bergizi - UPDATED',
        komponen_menu: [
          { nama: 'Nasi putih', porsi: '150g' },
          { nama: 'Ikan bakar', porsi: '100g' },
        ],
        kandungan_gizi: {
          kalori_total: 620,
          protein: 32,
          lemak: 15,
          karbohidrat: 85,
          serat: 8,
          gula: 5,
          natrium: 450,
        },
        deteksi_risiko: {
          alergi: ['Ikan - risiko tinggi untuk anak dengan alergi makanan laut'],
          tekstur: [],
          porsi_gizi: [],
        },
        rekomendasi: 'Menu sudah cukup seimbang...',
        status_keamanan: 'perlu_perhatian',
        ml_confidence: 0.87,
        total_sekolah: 3,
        sekolah_terassign: [
          {
            school_id: 'abc-123',
            nama_sekolah: 'SDN 01 Jakarta',
            npsn: '12345678',
          },
        ],
      },
    },
  },
})
@ApiResponse({
  status: 404,
  description: 'Menu tidak ditemukan',
})
@ApiResponse({
  status: 403,
  description: 'Anda tidak memiliki akses ke menu ini',
})
async updateMenu(
  @Req() req,
  @Param('menu_id', new ParseUUIDPipe({ version: '4' })) menuId: string,
  @Body() dto: UpdateMenuDto,
) {
  return this.sppgMenusService.updateMenu(req.user.userId, menuId, dto);
}
}
