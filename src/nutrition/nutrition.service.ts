import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MlService } from '../ml/ml.service';

@Injectable()
export class NutritionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mlService: MlService,
  ) {}

 async getNutritionDetail(menuId: string, userId: string, userRole: string) {
  // 1. Get menu
  const menu = await this.prismaService.menu.findUnique({
    where: { id: menuId },
    include: {
      sppgProfile: true,
      menuAssignments: {
        include: {
          schoolProfile: {
            select: { id: true, userId: true, namaSekolah: true },
          },
        },
      },
    },
  });

  if (!menu) {
    throw new NotFoundException('Menu tidak ditemukan');
  }

  // 2. Validate access
  this.validateAccess(menu, userId, userRole);

  // 3. Check if detailed nutrition already exists
  if (menu.detailNutrisi && menu.detailNutrisi !== null) {
    const data = menu.detailNutrisi as any;
    return {
      menu_id: menu.id,
      nama_menu: menu.namaMenu,
      ...data,
    };
  }

  // 4. Get basic nutrition data from kandunganGizi
  const basicNutrition = menu.kandunganGizi as any;

  // 5. Parse komponen menu
  let komponenMenu;
  try {
    komponenMenu = typeof menu.komponenMenu === 'string' 
      ? JSON.parse(menu.komponenMenu)
      : menu.komponenMenu;
  } catch (error) {
    komponenMenu = typeof menu.komponenMenu === 'string'
      ? menu.komponenMenu.split(',').map(k => k.trim())
      : menu.komponenMenu;
  }

  // 6. Generate detailed nutrition with basic data as reference
  console.log('Generating nutrition detail for menu:', menu.namaMenu);
  
  const nutritionData = await this.mlService.generateNutritionDetail({
    nama_menu: menu.namaMenu,
    komponen_menu: komponenMenu,
    basic_nutrition: basicNutrition, // ← KIRIM DATA BASIC KE ML
  });

  // 7. Save to database
  await this.prismaService.menu.update({
    where: { id: menuId },
    data: { detailNutrisi: nutritionData },
  });

  console.log('Nutrition detail generated and saved');

  return {
    menu_id: menu.id,
    nama_menu: menu.namaMenu,
    ...nutritionData,
  };
}

  private validateAccess(menu: any, userId: string, userRole: string): void {
    if (userRole === 'sppg') {
      // SPPG must own the menu
      if (menu.sppgProfile.userId !== userId) {
        throw new ForbiddenException(
          'Anda tidak memiliki akses ke menu ini',
        );
      }
    } else if (userRole === 'sekolah') {
      // School must be assigned to the menu
      const isAssigned = menu.menuAssignments.some(
        (assignment) => assignment.schoolProfile.userId === userId,
      );

      if (!isAssigned) {
        throw new ForbiddenException(
          'Menu ini tidak ditugaskan ke sekolah Anda',
        );
      }
    } else {
      throw new ForbiddenException('Role pengguna tidak valid');
    }
  }
}