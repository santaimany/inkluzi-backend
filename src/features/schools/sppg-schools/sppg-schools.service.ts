import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { GetSchoolsQueryDto } from './dto/get-schools-quey.dto';
import { isUUID } from 'class-validator';

@Injectable()
export class SppgSchoolsService {
    constructor(private readonly prisma: PrismaService){}

    async getMySchools(userId: string, query: GetSchoolsQueryDto){
        const {search, page = 1, limit = 10} = query;
        const skip = (page - 1) * limit;

        const sppgProfile = await this.prisma.sppgProfile.findUnique({
            where: { userId },
            select: { id: true , namaInstansi: true},
        })

        if(!sppgProfile){
            throw new NotFoundException('Profil SPPG tidak ditemukan');
        }

        const whereCondition: any = {
            sppgId: sppgProfile.id,
        }

        if(search){
            whereCondition.OR = [
                { namaSekolah: { contains: search, mode: 'insensitive' } },
                { npsn: { contains: search, mode: 'insensitive' } },
            ]
        }

        const total = await this.prisma.schoolProfile.count({
            where: whereCondition,  
        })

        const schools = await this.prisma.schoolProfile.findMany({
            where: whereCondition,
            select: {
                id: true,
                userId: true,
                namaSekolah: true,
                photoUrl: true,
            }
        })

        return {
            success: true,
            message: 'Schools retrieved successfully',
            data: schools.map((school) => ({
                id: school.id,
                user_id: school.userId,
                nama_sekolah: school.namaSekolah,
                photo_url: school.photoUrl,
                total_schools: total,
            }))
        }
     }

     async getSchoolDetail(userId: string, schoolUserId: string){
        const sppgProfile = await this.prisma.sppgProfile.findUnique({
            where: { userId },
            select: { id: true },
        })

         if (!isUUID(schoolUserId)) {
    throw new BadRequestException('school_id harus berupa UUID yang valid');
        }

        
        if(!sppgProfile){
            throw new NotFoundException('Profil SPPG tidak ditemukan');
        }

        const schoolProfile = await this.prisma.schoolProfile.findUnique({
            where: { userId: schoolUserId },
            include: {
                user: {
                    select: {
                        email: true,
                        status: true,
                        createdAt: true,
                }
            },
            disabilityTypes: {
                select: {
                    jenisDisabilitas: true,
                    jumlahSiswa: true,
                }
            }
        }
        })

        if(!schoolProfile) {
            throw new NotFoundException('Sekolah tidak ditemukan');
        }

        if(schoolProfile.sppgId !== sppgProfile.id){
            throw new ForbiddenException('Sekolah ini tidak terdaftar di bawah SPPG Anda');
        }

        return {
            success: true,
            message: 'School details retrieved successfully',
            data: {
                id: schoolProfile.id,
                email: schoolProfile.user.email,
                status: schoolProfile.user.status,
                nama_sekolah: schoolProfile.namaSekolah,
                npsn: schoolProfile.npsn,
                jenis_sekolah: schoolProfile.jenisSekolah,
                alamat: schoolProfile.alamat,
                total_siswa: schoolProfile.totalSiswa,
                penanggung_jawab: schoolProfile.penanggungJawab,
                nomor_kontak: schoolProfile.nomorKontak,
                photo_url: schoolProfile.photoUrl,
                disability_types: schoolProfile.disabilityTypes.map((dt) => ({
                    jenis_disabilitas: dt.jenisDisabilitas,
                    jumlah_siswa: dt.jumlahSiswa,
                })),
                created_at: schoolProfile.user.createdAt,
            }
        }
     }
}
