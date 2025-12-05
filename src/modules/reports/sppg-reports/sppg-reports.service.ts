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

  
  async getReports(sppgUserId: string, query: GetReportsQueryDto) {
  
    const sppgProfile = await this.prisma.sppgProfile.findUnique({
      where: { userId: sppgUserId },
    });

    if (!sppgProfile) {
      throw new NotFoundException('SPPG profile tidak ditemukan');
    }

  
    const where: any = {
      sppgId: sppgProfile.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.school_id) {
      where.sekolahId = query.school_id;
    }

 
    const total = await this.prisma.report.count({ where });

  
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


    const data = reports.map((report) => ({
      id: report.id,
      menu_name: report.menu?.namaMenu || null,
      school_name: report.schoolProfile.namaSekolah,
      status: report.status,
      created_at: report.createdAt.toISOString(),
    }));


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


  async getReportDetail(sppgUserId: string, reportId: string) {

    const sppgProfile = await this.prisma.sppgProfile.findUnique({
      where: { userId: sppgUserId },
    });

    if (!sppgProfile) {
      throw new NotFoundException('SPPG profile tidak ditemukan');
    }

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


    if (report.sppgId !== sppgProfile.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke laporan ini');
    }


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


  async respondToReport(
    sppgUserId: string,
    reportId: string,
    dto: RespondReportDto,
  ) {
   
    const sppgProfile = await this.prisma.sppgProfile.findUnique({
      where: { userId: sppgUserId },
    });

    if (!sppgProfile) {
      throw new NotFoundException('SPPG profile tidak ditemukan');
    }


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

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'completed',
        sppgResponse: dto.sppg_response || null,
        respondedAt: new Date(),
      },
    });

 
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