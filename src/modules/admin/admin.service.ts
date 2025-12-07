import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EmailService } from 'src/shared/email/email.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ){}

  async getAllUsers(query: GetUsersQueryDto){
    const {role, status, search, page = 1, limit = 10} = query;
    const skip = (page - 1) * limit;

    const where: any = {
      role: { not:'admin'},
    }
    if(role) {
      where.role = role;
    }
    if(status) {
      where.status = status;
    }

    if(search){
      where.OR = [
        { email: {contains: search, mode: 'insensitive'}},
        {
          sppgProfile: {
            namaInstansi: { contains: search, mode: 'insensitive'}
          },
        },
        {
          schoolProfile: {
            namaSekolah: { contains: search, mode:'insensitive'}
          }
        }
      ]
    }

    const total = await this.prisma.user.count({where});
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        sppgProfile: {
          select: {
            id: true,
            namaInstansi: true,
            _count: {
              select: { schoolProfiles: true },
            }
          }
        },
        schoolProfile: {
          select: {
            namaSekolah: true,
            totalSiswa: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    })

    const data = users.map((user)=> ({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      profile_name: user.role === 'sppg' ? user.sppgProfile?.namaInstansi : user.schoolProfile?.namaSekolah,
      ...user.role === 'sppg' && {
        jumlah_sekolah: user.sppgProfile?._count?.schoolProfiles || 0,
      },
      ...user.role === 'sekolah' && {
        total_siswa: user.schoolProfile?.totalSiswa || 0,
      },
      created_at: user.createdAt,
    }))

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }
  }


  async getUserDetail(userId: string) {
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

    if(!user) {
      throw new Error('User not found');
    }
    
    if(user.role === 'admin') {
      throw new ForbiddenException('Access to admin user details is forbidden');
    }

    let profileData: any;


    if (user.role === 'sppg' && user.sppgProfile) {
      // Get schools assigned to this SPPG
      const schools = await this.prisma.schoolProfile.findMany({
        where: { sppgId: user.sppgProfile.id },
        select: {
          id: true,
          namaSekolah: true,
          npsn: true,
          jenisSekolah: true,
        },
      });

      profileData = {
        nama_instansi: user.sppgProfile.namaInstansi,
        wilayah_kerja: user.sppgProfile.wilayahKerja,
        alamat: user.sppgProfile.alamat,
        penanggung_jawab: user.sppgProfile.penanggungJawab,
        nomor_kontak: user.sppgProfile.nomorKontak,
        photo_url: user.sppgProfile.photoUrl,
        schools: schools.map((school) => ({
          id: school.id,
          nama_sekolah: school.namaSekolah,
          npsn: school.npsn,
          jenis_sekolah: school.jenisSekolah,
        })),
      };
    } else if (user.role === 'sekolah' && user.schoolProfile) {
      // Get SPPG data if assigned
      let sppgData = null;
      if (user.schoolProfile.sppgId) {
        const sppg = await this.prisma.sppgProfile.findUnique({
          where: { id: user.schoolProfile.sppgId },
          select: {
            id: true,
            namaInstansi: true,
          },
        });
        if (sppg) {
          sppgData = {
            id: sppg.id,
            nama_instansi: sppg.namaInstansi,
          };
        }
      }

      profileData = {
        nama_sekolah: user.schoolProfile.namaSekolah,
        npsn: user.schoolProfile.npsn,
        jenis_sekolah: user.schoolProfile.jenisSekolah,
        alamat: user.schoolProfile.alamat,
        total_siswa: user.schoolProfile.totalSiswa,
        penanggung_jawab: user.schoolProfile.penanggungJawab,
        nomor_kontak: user.schoolProfile.nomorKontak,
        photo_url: user.schoolProfile.photoUrl,
        sppg: sppgData,
        disability_types: user.schoolProfile.disabilityTypes.map((dt) => ({
          jenis_disabilitas: dt.jenisDisabilitas,
          jumlah_siswa: dt.jumlahSiswa,
        })),
      }
    }
   

    return {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.createdAt,
        profile_data: profileData,
    };
  } 

  async updateUserStatus(userId: string, dto: UpdateUserStatusDto){
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
      include: {
        sppgProfile: true,
        schoolProfile: true,
      }
    })

    if(!user) {
      throw new NotFoundException('User tidak ditemukan')
    }
    if(user.role === 'admin') {
      throw new ForbiddenException('Tidak dapat mengubah status user admin');
    }

    const oldStatus = user.status;

    await this.prisma.user.update({
      where: {id: userId},
      data: {
        status: dto.status,
      }
    })

    if(oldStatus !== dto.status) {
      const profileName = user.role === 'sppg' ? user.sppgProfile?.namaInstansi : user.schoolProfile?.namaSekolah;
      if (dto.status === 'active') {
        await this.emailService.sendAccountActivationEmail(
          user.email,
          profileName || user.email,
          user.role
        )
      } else if(dto.status === 'inactive') {
        await this.emailService.sendAccountDeactivationEmail(
          user.email,
          profileName || user.email,
          user.role
        )
      }
    }

    return {
      message: `Status user berhasil diubah menjadi ${dto.status}`,
    }
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {id: userId},
    });
    if(!user) {
      throw new NotFoundException('User tidak ditemukan');
    }
    if(user.role === 'admin') {
      throw new ForbiddenException('Tidak dapat menghapus user admin');
    }

    await this.prisma.user.delete({
      where: {id: userId},
    });

    return {
      message: 'User berhasil dihapus',
    }
  }
}
