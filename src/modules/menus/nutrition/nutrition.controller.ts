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
import { Roles } from 'src/modules/auth/decorators/roles.decorators';

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
  schema: {
    type: 'object',
    properties: {
      menu_id: {
        type: 'string',
        example: '38ff84c5-d34a-4ed7-86e3-50b3d792fab0',
        description: 'ID menu'
      },
      nama_menu: {
        type: 'string',
        example: 'Nasi Ayam Goreng',
        description: 'Nama menu'
      },
      deskripsi: {
        type: 'string',
        example: 'Menu Nasi Ayam Goreng ini menyediakan sumber energi esensial untuk aktivitas harian siswa berkebutuhan khusus...',
        description: 'Deskripsi lengkap menu dan manfaatnya'
      },
      info_nutrisi: {
        type: 'object',
        properties: {
          total_kalori: {
            type: 'number',
            example: 570,
            description: 'Total kalori menu'
          },
          total_porsi: {
            type: 'string',
            example: '645 gram/porsi',
            description: 'Total porsi menu'
          },
          donut_chart: {
            type: 'object',
            properties: {
              karbohidrat: {
                type: 'object',
                properties: {
                  persentase: { type: 'number', example: 44.3 },
                  label: { type: 'string', example: 'Karbohidrat\n44.3%' }
                }
              },
              protein: {
                type: 'object',
                properties: {
                  persentase: { type: 'number', example: 21.3 },
                  label: { type: 'string', example: 'Protein\n21.3%' }
                }
              },
              lemak: {
                type: 'object',
                properties: {
                  persentase: { type: 'number', example: 34.4 },
                  label: { type: 'string', example: 'Lemak\n34.4%' }
                }
              },
              lainnya: {
                type: 'object',
                properties: {
                  persentase: { type: 'number', example: 0 },
                  label: { type: 'string', example: 'Lainnya\n0.0%' }
                }
              }
            }
          }
        }
      },
      persentase_akg: {
        type: 'object',
        properties: {
          kalori: {
            type: 'object',
            properties: {
              label: { type: 'string', example: 'Kalori' },
              nilai: { type: 'string', example: '28% Nilai Harian' }
            }
          },
          karbohidrat: {
            type: 'object',
            properties: {
              label: { type: 'string', example: 'Karbohidrat' },
              nilai: { type: 'string', example: '22% Nilai Harian' }
            }
          },
          protein: {
            type: 'object',
            properties: {
              label: { type: 'string', example: 'Protein' },
              nilai: { type: 'string', example: '47% Nilai Harian' }
            }
          },
          lemak: {
            type: 'object',
            properties: {
              label: { type: 'string', example: 'Lemak' },
              nilai: { type: 'string', example: '34% Nilai Harian' }
            }
          },
          serat: {
            type: 'object',
            properties: {
              label: { type: 'string', example: 'Serat' },
              nilai: { type: 'string', example: '5% Nilai Harian' }
            }
          },
          gula: {
            type: 'object',
            properties: {
              label: { type: 'string', example: 'Gula' },
              nilai: { type: 'string', example: '21% Nilai Harian' }
            }
          },
          sodium: {
            type: 'object',
            properties: {
              label: { type: 'string', example: 'Sodium' },
              nilai: { type: 'string', example: '18% Nilai Harian' }
            }
          }
        }
      },
      komponen_detail: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nama: { type: 'string', example: 'Nasi Putih' },
            berat: { type: 'string', example: '150 gram' },
            kalori: { type: 'number', example: 211 },
            satuan_kalori: { type: 'string', example: 'kkal Kalori' },
            nutrisi: {
              type: 'object',
              properties: {
                karbohidrat: {
                  type: 'object',
                  properties: {
                    nilai: { type: 'string', example: '48.4g' },
                    label: { type: 'string', example: 'Karbohidrat' }
                  }
                },
                protein: {
                  type: 'object',
                  properties: {
                    nilai: { type: 'string', example: '4.5g' },
                    label: { type: 'string', example: 'Protein' }
                  }
                },
                lemak: {
                  type: 'object',
                  properties: {
                    nilai: { type: 'string', example: '0.4g' },
                    label: { type: 'string', example: 'Lemak' }
                  }
                },
                gula: {
                  type: 'object',
                  properties: {
                    nilai: { type: 'string', example: '0g' },
                    label: { type: 'string', example: 'Gula' }
                  }
                },
                serat: {
                  type: 'object',
                  properties: {
                    nilai: { type: 'string', example: '0.4g' },
                    label: { type: 'string', example: 'Serat' }
                  }
                },
                sodium: {
                  type: 'object',
                  properties: {
                    nilai: { type: 'string', example: '1mg' },
                    label: { type: 'string', example: 'Sodium' }
                  }
                }
              }
            }
          }
        },
        example: [
          {
            nama: 'Nasi Putih',
            berat: '150 gram',
            kalori: 211,
            satuan_kalori: 'kkal Kalori',
            nutrisi: {
              karbohidrat: { nilai: '48.4g', label: 'Karbohidrat' },
              protein: { nilai: '4.5g', label: 'Protein' },
              lemak: { nilai: '0.4g', label: 'Lemak' },
              gula: { nilai: '0g', label: 'Gula' },
              serat: { nilai: '0.4g', label: 'Serat' },
              sodium: { nilai: '1mg', label: 'Sodium' }
            }
          },
          {
            nama: 'Ayam Goreng',
            berat: '90 gram',
            kalori: 252,
            satuan_kalori: 'kkal Kalori',
            nutrisi: {
              karbohidrat: { nilai: '7.0g', label: 'Karbohidrat' },
              protein: { nilai: '20.0g', label: 'Protein' },
              lemak: { nilai: '16.7g', label: 'Lemak' },
              gula: { nilai: '0.5g', label: 'Gula' },
              serat: { nilai: '0g', label: 'Serat' },
              sodium: { nilai: '350mg', label: 'Sodium' }
            }
          }
        ]
      },
      informasi_akg: {
        type: 'object',
        properties: {
          pengertian: {
            type: 'string',
            example: 'AKG (Angka Kecukupan Gizi) adalah acuan jumlah energi dan zat gizi yang sebaiknya dikonsumsi seseorang setiap hari sesuai usia dan kondisi tubuh.'
          },
          fungsi: {
            type: 'string',
            example: 'Persentase AKG menunjukkan seberapa besar kontribusi satu porsi menu terhadap kebutuhan harian...'
          },
          tetapan_akg: {
            type: 'object',
            properties: {
              energi: { type: 'string', example: '2000 kkal' },
              karbohidrat: { type: 'string', example: '300 g' },
              protein: { type: 'string', example: '66 g' },
              lemak: { type: 'string', example: '65 g' },
              serat: { type: 'string', example: '30 g' },
              sodium: { type: 'string', example: '2300 mg' }
            }
          }
        }
      }
    }
  }
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