import { Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MlService } from 'src/ml/ml.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SaveScanResultDto } from './dto/save-scan-result.dto';

@Injectable()
export class FoodScanService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService,
        private readonly mlService: MlService
    ){}

  // food-scan.service.ts

async analyzeFoodOnly(userId: string, file: Express.Multer.File) {
  // 1. Cari school profile user
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

  // 2. Upload gambar ke Cloudinary
  const uploadResult = await this.cloudinary.uploadImage(file, 'food-scans');

  try {
    // 3. Kirim ke ML service (Gemini) untuk analisis
    const mlResult = await this.mlService.analyzeFoodImage(
      uploadResult.secure_url,
      schoolProfile.disabilityTypes,
    )

    // 4. Return hasil TANPA save ke database
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
    // Jika ML gagal, hapus gambar dari Cloudinary
    await this.cloudinary.deleteImage(uploadResult.public_id);
    throw error;
  }
}

async saveScanResult(userId: string, dto: SaveScanResultDto) {
  // 1. Cari school profile user
  const schoolProfile = await this.prisma.schoolProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!schoolProfile) {
    throw new NotFoundException('Profil sekolah tidak ditemukan');
  }

  // 2. Save hasil yang sudah di-review/edit user ke database
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

  // 3. Return response
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
}
