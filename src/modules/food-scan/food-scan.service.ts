import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { MlService } from 'src/shared/ml/ml.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { SaveScanResultDto } from './dto/save-scan-result.dto';
import { GetScanHistoryQueryDto } from './dto/get-scan-history-query.dto';

@Injectable()
export class FoodScanService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly mlService: MlService
    ){}

async analyzeFoodOnly(userId: string, file: Express.Multer.File) {

  const schoolProfile = await this.prisma.schoolProfile.findUnique({
    where: { userId },
    include: {
      disabilityTypes: {
        select: {
          jenisDisabilitas: true,
          jumlahSiswa: true,
        }
      }
    }
  })

  if (!schoolProfile) {
    throw new NotFoundException('Profil sekolah tidak ditemukan');
  }

  
  const uploadResult = await this.cloudinary.uploadImage(file, 'food-scans');

  try {
 
    const mlResult = await this.mlService.analyzeFoodImage(
      uploadResult.secure_url,
      schoolProfile.disabilityTypes,
    )

    return {
      success: true,
      message: 'Makanan berhasil di-scan. Review hasil sebelum menyimpan.',
      data: {
        image_url: uploadResult.secure_url,
        cloudinary_public_id: uploadResult.public_id,
        nama_makanan: mlResult.nama_makanan,
        komponen_menu: mlResult.komponen_menu,
        kandungan_gizi: mlResult.kandungan_gizi,
        deteksi_risiko: mlResult.deteksi_risiko,
        rekomendasi: mlResult.rekomendasi,
        ml_confidence: mlResult.confidence,
      },
    }
  } catch (error) {
    await this.cloudinary.deleteImage(uploadResult.public_id);
    throw error;
  }
}

async saveScanResult(userId: string, dto: SaveScanResultDto) {
  const schoolProfile = await this.prisma.schoolProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!schoolProfile) {
    throw new NotFoundException('Profil sekolah tidak ditemukan');
  }

  const foodScan = await this.prisma.foodScan.create({
    data: {
      sekolahId: schoolProfile.id,
      imageUrl: dto.image_url,
      cloudinaryPublicId: dto.cloudinary_public_id,
      namaMakanan: dto.nama_makanan,
      komponenMenu: dto.komponen_menu as any,
      kandunganGizi: dto.kandungan_gizi as any,
      deteksiRisiko: dto.deteksi_risiko as any,
      rekomendasi: dto.rekomendasi,
      mlConfidence: dto.ml_confidence,
    }
  })

  return {
    success: true,
    message: 'Hasil scan berhasil disimpan',
    data: {
      id: foodScan.id,
      image_url: foodScan.imageUrl,
      nama_makanan: foodScan.namaMakanan,
      komponen_menu: foodScan.komponenMenu,
      kandungan_gizi: foodScan.kandunganGizi,
      deteksi_risiko: foodScan.deteksiRisiko,
      rekomendasi: foodScan.rekomendasi,
      ml_confidence: foodScan.mlConfidence,
      scanned_at: foodScan.scannedAt,
    },
  }
}


async getScanHistory(userId: string, query: GetScanHistoryQueryDto) {
    const { page = 1, limit = 10 } = query;

    const skip = (page - 1) * limit;

    const schoolProfile = await this.prisma.schoolProfile.findUnique({
        where: { userId },
        select: { id: true },
    })

    if (!schoolProfile) {
        throw new NotFoundException('Profil sekolah tidak ditemukan');
    }

    const total = await this.prisma.foodScan.count ({
        where: { sekolahId: schoolProfile.id},
    })

    const scans = await this.prisma.foodScan.findMany({
        where: { sekolahId: schoolProfile.id },
        select: {
            id: true,
            namaMakanan: true,
            scannedAt: true,
        },
        orderBy: {
            scannedAt: 'desc',
        },
        skip,
        take: limit,
    })

    return {
        success: true,
        message: 'Riwayat scan berhasil diambil',
        data: {
            scans: scans.map((scan) => ({
                id: scan.id,
                nama_makanan: scan.namaMakanan,
                scanned_at: scan.scannedAt,
            })),
            pagination: {
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit),
            },
        },
    }
}

async getScanDetail(userId: string, scanId: string) {
    const schoolProfile = await this.prisma.schoolProfile.findUnique({
        where: { userId },
        select: { id: true },
    })

    if (!schoolProfile) {
        throw new NotFoundException('Profil sekolah tidak ditemukan');
    }

    const scan = await this.prisma.foodScan.findUnique({
        where: { id: scanId },
    })

    if(!scan ){
        throw new NotFoundException('Hasil scan tidak ditemukan');
    }

    if(scan.sekolahId !== schoolProfile.id){
        throw new ForbiddenException('Anda tidak memiliki akses ke hasil scan ini');
    }

    return {
        success: true,
        message: 'Detail hasil scan berhasil diambil',
        data: {
            id: scan.id,
            image_url: scan.imageUrl,
            nama_makanan: scan.namaMakanan,
            komponen_menu: scan.komponenMenu,
            kandungan_gizi: scan.kandunganGizi,
            deteksi_risiko: scan.deteksiRisiko,
            rekomendasi: scan.rekomendasi,
            ml_confidence: scan.mlConfidence,
            scanned_at: scan.scannedAt,
        },
    }
}

 async deleteScan(userId: string, scanId: string) {
    const schoolProfile = await this.prisma.schoolProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!schoolProfile) {
      throw new NotFoundException('Profil sekolah tidak ditemukan');
    }

    const scan = await this.prisma.foodScan.findUnique({
      where: { id: scanId },
    });

    if (!scan) {
      throw new NotFoundException('Hasil scan tidak ditemukan');
    }


    if (scan.sekolahId !== schoolProfile.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke scan ini');
    }


    if (scan.cloudinaryPublicId) {
      await this.cloudinary.deleteImage(scan.cloudinaryPublicId);
    }

 
    await this.prisma.foodScan.delete({
      where: { id: scanId },
    });

    return {
      success: true,
      message: 'Hasil scan berhasil dihapus',
    };
  }
}
