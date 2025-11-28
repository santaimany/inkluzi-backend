import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        sppgProfile: true,
        schoolProfile: {
          include: {
            disabilityTypes: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const profile =
      user.role === 'sppg'
        ? {
            id: user.sppgProfile?.id,
            nama_instansi: user.sppgProfile?.namaInstansi,
            wilayah_kerja: user.sppgProfile?.wilayahKerja,
            alamat: user.sppgProfile?.alamat,
            penanggung_jawab: user.sppgProfile?.penanggungJawab,
            nomor_kontak: user.sppgProfile?.nomorKontak,
            photo_url: user.sppgProfile?.photoUrl,
          }
        : {
            id: user.schoolProfile?.id,
            nama_sekolah: user.schoolProfile?.namaSekolah,
            npsn: user.schoolProfile?.npsn,
            jenis_sekolah: user.schoolProfile?.jenisSekolah,
            alamat: user.schoolProfile?.alamat,
            total_siswa: user.schoolProfile?.totalSiswa,
            penanggung_jawab: user.schoolProfile?.penanggungJawab,
            nomor_kontak: user.schoolProfile?.nomorKontak,
            photo_url: user.schoolProfile?.photoUrl,
            disability_types: user.schoolProfile?.disabilityTypes.map((dt) => ({
              jenis_disabilitas: dt.jenisDisabilitas,
              jumlah_siswa: dt.jumlahSiswa,
            })),
          };

    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile_data: profile,
      },
    };
  }

async updateMyProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
    photo?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        sppgProfile: {
          select: {
            cloudinaryPublicId: true,
          },
        },
        schoolProfile: {
          select: {
            cloudinaryPublicId: true,
            totalSiswa: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    let photoUrl: string | undefined;
    let cloudinaryPublicId: string | undefined;
    let oldPublicId: string | null = null;

    

    // Upload foto baru jika ada
    if (photo) {
      const folder = user.role === 'sppg' ? 'sppg-profiles' : 'school-profiles';
      const uploadResult = await this.cloudinaryService.uploadImage(photo, folder);
      photoUrl = uploadResult.url;
      cloudinaryPublicId = uploadResult.publicId;

      // Simpan public ID lama untuk dihapus
      if (user.role === 'sppg' && user.sppgProfile?.cloudinaryPublicId) {
        oldPublicId = user.sppgProfile.cloudinaryPublicId;
      } else if (user.role === 'sekolah' && user.schoolProfile?.cloudinaryPublicId) {
        oldPublicId = user.schoolProfile.cloudinaryPublicId;
      }
    }

    // Update profile berdasarkan role
    if (user.role === 'sppg') {
      await this.prisma.sppgProfile.update({
        where: { userId },
        data: {
          ...(updateProfileDto.nama_instansi && { namaInstansi: updateProfileDto.nama_instansi }),
          ...(updateProfileDto.wilayah_kerja && { wilayahKerja: updateProfileDto.wilayah_kerja }),
          ...(updateProfileDto.alamat && { alamat: updateProfileDto.alamat }),
          ...(updateProfileDto.penanggung_jawab && { penanggungJawab: updateProfileDto.penanggung_jawab }),
          ...(updateProfileDto.nomor_kontak && { nomorKontak: updateProfileDto.nomor_kontak }),
          ...(photoUrl && { photoUrl }),
          ...(cloudinaryPublicId && { cloudinaryPublicId }),
        },
      });
    } else if (user.role === 'sekolah') {
      // Validasi disability types jika ada
      if (updateProfileDto.disability_types && updateProfileDto.disability_types.length > 0) {
        const totalDisabilitas = updateProfileDto.disability_types.reduce(
          (sum, dt) => sum + Number(dt.jumlah_siswa),
          0,
        );
        const totalSiswa = updateProfileDto.total_siswa || user.schoolProfile?.totalSiswa || 0;

        if (totalDisabilitas > totalSiswa) {
          throw new BadRequestException(
            `Total jumlah siswa disabilitas (${totalDisabilitas}) tidak boleh melebihi total siswa sekolah (${totalSiswa})`,
          );
        }

        // Hapus semua disability types lama
        await this.prisma.disabilityType.deleteMany({
          where: { schoolProfileId: userId },
        });
      }

      await this.prisma.schoolProfile.update({
        where: { userId },
        data: {
          ...(updateProfileDto.nama_sekolah && { namaSekolah: updateProfileDto.nama_sekolah }),
          ...(updateProfileDto.npsn && { npsn: updateProfileDto.npsn }),
          ...(updateProfileDto.jenis_sekolah && { jenisSekolah: updateProfileDto.jenis_sekolah }),
          ...(updateProfileDto.alamat && { alamat: updateProfileDto.alamat }),
          ...(updateProfileDto.total_siswa !== undefined && { totalSiswa: updateProfileDto.total_siswa }),
          ...(updateProfileDto.penanggung_jawab && { penanggungJawab: updateProfileDto.penanggung_jawab }),
          ...(updateProfileDto.nomor_kontak && { nomorKontak: updateProfileDto.nomor_kontak }),
          ...(photoUrl && { photoUrl }),
          ...(cloudinaryPublicId && { cloudinaryPublicId }),
          ...(updateProfileDto.disability_types &&
            updateProfileDto.disability_types.length > 0 && {
              disabilityTypes: {
                create: updateProfileDto.disability_types.map((dt) => ({
                  jenisDisabilitas: dt.jenis_disabilitas,
                  jumlahSiswa: Number(dt.jumlah_siswa),
                })),
              },
            }),
        },
      });
    }

    // Hapus foto lama dari Cloudinary jika ada
    if (oldPublicId) {
      await this.cloudinaryService.deleteImage(oldPublicId);
    }

    return await this.getMyProfile(userId);
  }
}