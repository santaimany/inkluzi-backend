import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { GetReportsQueryDto } from './dto/get-reports-query.dto';
import { RespondReportDto } from './dto/respond-report.dto';

//TODO: Masih belum di cek fungsionalitasnya masih full dari ai

@Injectable()
export class SppgReportsService {
  constructor(private prisma: PrismaService) {}

  // GET LIST REPORTS
  async getReports(sppgUserId: string, query: GetReportsQueryDto) {
    // 1. Dapatkan SPPG Profile
    const sppgProfile = await this.prisma.sppgProfile.findUnique({
      where: { userId: sppgUserId },
    });

    if (!sppgProfile) {
      throw new NotFoundException('SPPG profile tidak ditemukan');
    }

    // 2. Build where clause
    const where: any = {
      sppgId: sppgProfile.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.school_id) {
      where.sekolahId = query.school_id;
    }

    // 3. Hitung total data
    const total = await this.prisma.report.count({ where });

    // 4. Fetch reports dengan pagination
    const reports = await this.prisma.report.findMany({
      where,
      include: {
        menu: true,
        schoolProfile: true,
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
      school_name: report.schoolProfile.namaSekolah,
      status: report.status,
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
  async getReportDetail(sppgUserId: string, reportId: string) {
    // 1. Dapatkan SPPG Profile
    const sppgProfile = await this.prisma.sppgProfile.findUnique({
      where: { userId: sppgUserId },
    });

    if (!sppgProfile) {
      throw new NotFoundException('SPPG profile tidak ditemukan');
    }

    // 2. Fetch report
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        menu: true,
        schoolProfile: {
          include: {
            disabilityTypes: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Laporan tidak ditemukan');
    }

    // 3. Verify ownership
    if (report.sppgId !== sppgProfile.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke laporan ini');
    }

    // 4. Format response
    return {
      success: true,
      message: 'Operation successful',
      data: {
        id: report.id,
        sekolah: {
          id: report.schoolProfile.id,
          nama_sekolah: report.schoolProfile.namaSekolah,
          npsn: report.schoolProfile.npsn,
          penanggung_jawab: report.schoolProfile.penanggungJawab,
          nomor_kontak: report.schoolProfile.nomorKontak,
          jenis_disabilitas: report.schoolProfile.disabilityTypes.map((dt) => ({
            jenis: dt.jenisDisabilitas,
            jumlah_siswa: dt.jumlahSiswa,
          })),
        },
        menu: report.menu
          ? {
              id: report.menu.id,
              nama_menu: report.menu.namaMenu,
              tanggal_disajikan: report.menu.tanggalDisajikan.toISOString().split('T')[0],
            }
          : null,
        laporan: {
          foto_menu: report.imageUrl,
          catatan: report.catatan,
          status: report.status,
          created_at: report.createdAt.toISOString(),
        },
        respon_sppg: {
          response: report.sppgResponse,
          responded_at: report.respondedAt?.toISOString() || null,
        },
      },
    };
  }

  // RESPOND TO REPORT (UPDATE)
  async respondToReport(
    sppgUserId: string,
    reportId: string,
    dto: RespondReportDto,
  ) {
    // 1. Dapatkan SPPG Profile
    const sppgProfile = await this.prisma.sppgProfile.findUnique({
      where: { userId: sppgUserId },
    });

    if (!sppgProfile) {
      throw new NotFoundException('SPPG profile tidak ditemukan');
    }

    // 2. Cek apakah report ada dan milik SPPG ini
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: {
        schoolProfile: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Laporan tidak ditemukan');
    }

    if (report.sppgId !== sppgProfile.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke laporan ini');
    }

    // 3. Update report - set status ke completed dan simpan response (jika ada)
    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'completed',
        sppgResponse: dto.sppg_response || null,
        respondedAt: new Date(),
      },
    });

    // 4. Return response
    return {
      success: true,
      message: 'Laporan berhasil ditanggapi',
      data: {
        report_id: updatedReport.id,
        status: updatedReport.status,
        sppg_response: updatedReport.sppgResponse,
        responded_at: updatedReport.respondedAt.toISOString(),
      },
    };
  }
}