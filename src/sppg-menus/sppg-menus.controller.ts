import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SppgMenusService } from './sppg-menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { GetMenusQueryDto } from './dto/get-menus-query.dto';

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
}
