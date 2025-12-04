import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { AssignSchoolsDto } from './dto/assign-schools.dto';

@Injectable()
export class AdminAssignService {
  constructor(private readonly prisma: PrismaService) {}

  async assignSchoolsToSppg(sppgId: string, dto: AssignSchoolsDto) {
    const sppgUser = await this.prisma.user.findUnique({
      where: { id: sppgId },
      include: { sppgProfile: true },
    });

    if (!sppgUser || sppgUser.role !== 'sppg') {
      throw new NotFoundException('SPPG tidak ditemukan');
    }

    if (!sppgUser.sppgProfile) {
      throw new NotFoundException('Profil SPPG tidak ditemukan');
    }

    const schools = await this.prisma.schoolProfile.findMany({
      where: {
        userId: { in: dto.school_ids },
      },
      select: {
        id: true,
        namaSekolah: true,
        sppgId: true,
      },
    });

    if(!schools){
        throw new NotFoundException('Sekolah tidak ditemukan');
    }

    if (schools.length !== dto.school_ids.length) {
      throw new NotFoundException('Beberapa sekolah tidak ditemukan');
    }

    const assignedSchools = schools.filter(
      (school) => school.sppgId && school.sppgId != sppgUser.sppgProfile.id,
    );
    if (assignedSchools.length > 0) {
      const schoolNames = assignedSchools.map((s) => s.namaSekolah).join(', ');
      throw new BadRequestException(
        `Beberapa sekolah sudah ditugaskan ke SPPG lain: ${schoolNames}`,
      );
    }

        await this.prisma.schoolProfile.updateMany({
      where: {
        userId: { in: dto.school_ids },
      },
      data: {
        sppgId: sppgUser.sppgProfile.id,
      },
    });

    return {
        message: `${dto.school_ids.length} sekolah berhasil ditugaskan ke SPPG.`,
        sppg: {
            id: sppgUser.id,
            nama_instansi: sppgUser.sppgProfile.namaInstansi,
        }
    }
  }

  async unassignSchoolsFromSppg(schoolId: string) {
    const school = await this.prisma.schoolProfile.findUnique({
        where: { userId: schoolId },
        select: {
            id: true,
            userId: true,
            namaSekolah: true,
            sppgId: true,
        }
    })

    if(!school) {
        throw new NotFoundException('Sekolah tidak ditemukan');
    }

    if(!school.sppgId) {
        throw new BadRequestException('Sekolah belum ditugaskan ke SPPG manapun');
    }

    await this.prisma.schoolProfile.update({
        where: {
            userId: schoolId,
        },
        data: {
            sppgId: null,
        }
    })

    return {
        message: `Sekolah ${school.namaSekolah} berhasil dihapus dari penugasan SPPG.`,
        school: {
            id: school.id,
            nama_sekolah: school.namaSekolah,
        }
    }
  }
}
