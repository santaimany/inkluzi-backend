import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { MlService } from '../../../shared/ml/ml.service';

@Injectable()
export class NutritionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mlService: MlService,
  ) {}

 async getNutritionDetail(menuId: string, userId: string, userRole: string) {

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


  this.validateAccess(menu, userId, userRole);


  if (menu.detailNutrisi && menu.detailNutrisi !== null) {
    const data = menu.detailNutrisi as any;
    return {
      menu_id: menu.id,
      nama_menu: menu.namaMenu,
      ...data,
    };
  }

  const basicNutrition = menu.kandunganGizi as any;


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


  console.log('Generating nutrition detail for menu:', menu.namaMenu);
  
  const nutritionData = await this.mlService.generateNutritionDetail({
    nama_menu: menu.namaMenu,
    komponen_menu: komponenMenu,
    basic_nutrition: basicNutrition, 
  });


  await this.prismaService.menu.update({
    where: { id: menuId },
    data: { detailNutrisi: nutritionData },
  });

  console.log('Nutrition detail generated and saved');

  return {
    status: 'success',
    message: 'Detail nutrisi berhasil diambil',
    data: {
    menu_id: menu.id,
    nama_menu: menu.namaMenu,
    ...nutritionData,
    },
  };
}

  private validateAccess(menu: any, userId: string, userRole: string): void {
    if (userRole === 'sppg') {

      if (menu.sppgProfile.userId !== userId) {
        throw new ForbiddenException(
          'Anda tidak memiliki akses ke menu ini',
        );
      }
    } else if (userRole === 'sekolah') {

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