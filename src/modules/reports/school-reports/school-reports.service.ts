import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';
import { CreateReportDto } from './dto/create-report.dto';
import { GetReportsQueryDto } from './dto/get-reports-query.dto';

// TODO: Belum diuji secara menyeluruh
@Injectable()
export class SchoolReportsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  // CREATE REPORT

async createReport(
  schoolUserId: string,
  dto: CreateReportDto,
  file?: Express.Multer.File,
) {
 
  const schoolProfile = await this.prisma.schoolProfile.findUnique({
    where: { userId: schoolUserId },
  });

  if (!schoolProfile) {
    throw new NotFoundException('School profile tidak ditemukan');
  }


  if (!schoolProfile.sppgId) {
    throw new BadRequestException(
      'Sekolah belum terassign ke SPPG. Tidak dapat membuat laporan.',
    );
  }

  const menuAssignment = await this.prisma.menuAssignment.findFirst({
    where: {
      menuId: dto.menu_id,
      sekolahId: schoolProfile.id,
    },
    include: {
      menu: true,
    },
  });

  if (!menuAssignment) {
    throw new BadRequestException(
      'Menu tidak ditemukan atau tidak terassign ke sekolah Anda',
    );
  }


  let imageUrl: string | null = null;
  let cloudinaryPublicId: string | null = null;

  if (file) {
    const uploadResult = await this.cloudinary.uploadImage(file, 'school_reports');
    imageUrl = uploadResult.secure_url;
    cloudinaryPublicId = uploadResult.public_id;
  }


  const report = await this.prisma.report.create({
    data: {
      sekolahId: schoolProfile.id,
      sppgId: schoolProfile.sppgId,
      menuId: dto.menu_id,
      imageUrl: imageUrl,
      cloudinaryPublicId: cloudinaryPublicId,
      catatan: dto.catatan,
      status: 'processing',
    },
    include: {
      menu: true,
      sppgProfile: true,
    },
  });

  // 6. Return response
  return {
    success: true,
    message: 'Laporan berhasil dikirim ke SPPG',
    data: {
      report_id: report.id,
      menu_name: report.menu.namaMenu, // ← Pasti ada karena menu_id required
      sppg_name: report.sppgProfile.namaInstansi,
      foto_menu: report.imageUrl,
      catatan: report.catatan,
      status: report.status,
      created_at: report.createdAt.toISOString(),
    },
  };
}

  // GET LIST REPORTS
  async getReports(schoolUserId: string, query: GetReportsQueryDto) {
    // 1. Dapatkan School Profile
    const schoolProfile = await this.prisma.schoolProfile.findUnique({
      where: { userId: schoolUserId },
    });

    if (!schoolProfile) {
      throw new NotFoundException('School profile tidak ditemukan');
    }

    // 2. Build where clause
    const where: any = {
      sekolahId: schoolProfile.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    // 3. Hitung total data
    const total = await this.prisma.report.count({ where });

    // 4. Fetch reports dengan pagination
    const reports = await this.prisma.report.findMany({
      where,
      include: {
        menu: true,
        sppgProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    // 5. Format response
    const data = reports.map((report) => ({
      id: report.id,
      menu_name: report.menu?.namaMenu || null,
      status: report.status,
      has_response: !!report.sppgResponse,
      created_at: report.createdAt.toISOString(),
    }));

    // 6. Return dengan pagination
    return {
      success: true,
      message: 'Operation successful',
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        total_pages: Math.ceil(total / query.limit),
      },
    };
  }

  // GET DETAIL REPORT
  async getReportDetail(schoolUserId: string, reportId: string) {
    // 1. Dapatkan School Profile
    const schoolProfile = await this.prisma.schoolProfile.findUnique({
      where: { userId: schoolUserId },
    });

    if (!schoolProfile) {
      throw new NotFoundException('School profile tidak ditemukan');
    }

    // 2. Fetch report
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        menu: true,
        sppgProfile: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Laporan tidak ditemukan');
    }

    // 3. Verify ownership
    if (report.sekolahId !== schoolProfile.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke laporan ini');
    }

    // 4. Format response
    return {
      success: true,
      message: 'Operation successful',
      data: {
        id: report.id,
        menu: report.menu
          ? {
              id: report.menu.id,
              nama_menu: report.menu.namaMenu,
              tanggal_disajikan: report.menu.tanggalDisajikan
                .toISOString()
                .split('T')[0],
            }
          : null,
        laporan: {
          photo_url: report.imageUrl,
          catatan: report.catatan,
          created_at: report.createdAt.toISOString(),
        },
        respon_sppg: {
          response: report.sppgResponse,
          responded_at: report.respondedAt?.toISOString() || null,
        },
      },
    };
  }
}