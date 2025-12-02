// src/sppg-menus/sppg-menus.service.ts

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MlService } from 'src/ml/ml.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { GetMenusQueryDto } from './dto/get-menus-query.dto';

@Injectable()
export class SppgMenusService {
    constructor(
        private prisma: PrismaService,
        private mlService: MlService,
    ) {}

    async createMenu(sppgUserId: string, dto: CreateMenuDto) {

        const sppgProfile = await this.prisma.sppgProfile.findUnique({
            where: { userId: sppgUserId },
        });

        if (!sppgProfile) {
            throw new NotFoundException('SPPG profile tidak ditemukan');
        }

        const assignedSchools = await this.prisma.schoolProfile.findMany({
            where: { sppgId: sppgProfile.id }, 
            include: {
                disabilityTypes: true,
            }
        });

        if (assignedSchools.length === 0) {
            throw new BadRequestException(
                'Anda belum memiliki sekolah yang ditugaskan. Silakan hubungi admin.'
            );
        }


        const menuDate = this.parseTanggalString(dto.tanggal);

        const allDisabilityTypes = new Set<string>();
        assignedSchools.forEach(school => {
            school.disabilityTypes.forEach(dt => {
                allDisabilityTypes.add(dt.jenisDisabilitas);
            });
        });

        const disabilityTypeNames = Array.from(allDisabilityTypes);


        const aiAnalysis = await this.mlService.analyzeMenu(
            dto.nama_menu,
            dto.komponen_menu,
            disabilityTypeNames,
        );


        const komponenMenuString = dto.komponen_menu
            .map(c => `${c.nama} (${c.porsi})`)
            .join(', ');


        const menu = await this.prisma.menu.create({
            data: {
                sppgId: sppgProfile.id,
                tanggalDisajikan: menuDate,
                namaMenu: dto.nama_menu,
                komponenMenu: komponenMenuString,
                kandunganGizi: aiAnalysis.kandungan_gizi as any,
                deteksiRisiko: aiAnalysis.deteksi_risiko as any,
                rekomendasi: aiAnalysis.rekomendasi,
                statusKeamanan: aiAnalysis.status_aman,
                mlConfidence: aiAnalysis.confidence / 100,
            }
        });

      
        const menuAssignments = assignedSchools.map(school => ({
            menuId: menu.id,
            sekolahId: school.id,
        }));

        await this.prisma.menuAssignment.createMany({
            data: menuAssignments,
        });

        return {
            status: 'success',
            message: `Menu berhasil dibuat dan ditugaskan ke ${assignedSchools.length} sekolah`,
            data: {
                menu_id: menu.id,
                tanggal: this.formatTanggalToString(menu.tanggalDisajikan),
                nama_menu: menu.namaMenu,
                status_keamanan: menu.statusKeamanan,
                ml_confidence: Math.round((menu.mlConfidence || 0) * 100),
                total_sekolah_assigned: assignedSchools.length,
                sekolah_list: assignedSchools.map(school => ({
                    school_id: school.userId,
                    nama_sekolah: school.namaSekolah,
                })),
                created_at: menu.createdAt,
            }
        };
    }

   async getMenus(sppgUserId: string, query: GetMenusQueryDto) {
    const { page = 1, limit = 10, school_id, month } = query;
    const skip = (page - 1) * limit;

    
    const sppgProfile = await this.prisma.sppgProfile.findUnique({
        where: { userId: sppgUserId },
    });

    if (!sppgProfile) {
        throw new NotFoundException('SPPG profile tidak ditemukan');
    }


    const where: any = { sppgId: sppgProfile.id };


    if (school_id) {
        const school = await this.prisma.schoolProfile.findUnique({
            where: { userId: school_id },
        });

        if (!school) {
            throw new NotFoundException('Sekolah tidak ditemukan');
        }

        if (school.sppgId !== sppgProfile.id) {
            throw new ForbiddenException('Anda tidak memiliki akses ke sekolah ini');
        }

        where.menuAssignments = {
            some: {
                sekolahId: school.id,
            },
        };
    }

  
    if (month) {
        const [year, monthNum] = month.split('-').map(Number);
        if (isNaN(year) || isNaN(monthNum)) {
            throw new BadRequestException('Format bulan tidak valid. Gunakan format: YYYY-MM');
        }

        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);

        where.tanggalDisajikan = {
            gte: startDate,
            lte: endDate,
        };
    }


    const [menus, total] = await Promise.all([
        this.prisma.menu.findMany({
            where,
            skip,
            take: limit,
            orderBy: { tanggalDisajikan: 'desc' },
            include: {
                menuAssignments: {
                    include: {
                        schoolProfile: {
                            select: {
                                userId: true,
                                namaSekolah: true,
                            },
                        },
                    },
                },
            },
        }),
        this.prisma.menu.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        status: 'success',
        message: 'Data menu berhasil diambil',
        data: menus.map(menu => {
         
            const komponenList = menu.komponenMenu.split(', ').map(item => {
                const match = item.match(/^(.*?)\s*\((.*?)\)$/);
                if (match) {
                    return match[1].trim(); 
                }
                return item;
            });

            const deteksiRisiko = menu.deteksiRisiko as any;
            const risikoUmumRingkas: string[] = [];
            
            if (deteksiRisiko) {
              
                Object.keys(deteksiRisiko).forEach(kategori => {
                    if (Array.isArray(deteksiRisiko[kategori])) {
                        risikoUmumRingkas.push(...deteksiRisiko[kategori]);
                    }
                });
            }

  
            const risikoDisplay = risikoUmumRingkas.slice(0, 2);
            if (risikoDisplay.length === 0) {
                risikoDisplay.push('Tidak ditemukan risiko signifikan.');
            }

   
            const kandunganGizi = menu.kandunganGizi as any;
            const ringkasanGizi = kandunganGizi ? {
                kalori: `${kandunganGizi.kalori_total} kkal`,
                protein: `${kandunganGizi.protein} g`,
                lemak: `${kandunganGizi.lemak} g`,
                serat: `${kandunganGizi.serat} g`,
            } : null;

            return {
                menu_id: menu.id,
                nama_menu: menu.namaMenu,
                tanggal: this.formatTanggalToString(menu.tanggalDisajikan),
                komponen_menu_ringkas: komponenList,
                risiko_umum_ringkas: risikoDisplay,
                ringkasan_gizi: ringkasanGizi,
                status_keamanan: menu.statusKeamanan,
                total_sekolah: menu.menuAssignments.length,
                created_at: menu.createdAt,
            };
        }),
        pagination: {
            current_page: page,
            total_pages: totalPages,
            total_items: total,
            items_per_page: limit,
        },
    };
}

    //++++++++++++++++++++++++
    //HELPER FUNCTIONS
    //++++++++++++++++++++++++

    private parseTanggalString(tanggalStr: string): Date {
        const hariMap = {
            'minggu': 0, 'senin': 1, 'selasa': 2, 'rabu': 3,
            'kamis': 4, 'jumat': 5, 'sabtu': 6
        };

        const bulanMap = {
            'januari': 0, 'februari': 1, 'maret': 2, 'april': 3,
            'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7,
            'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
        };

        try {
            const parts = tanggalStr.split(',');
            if (parts.length !== 2) {
                throw new Error('Format tanggal tidak valid');
            }

            const namaHari = parts[0].trim().toLowerCase();
            const dateParts = parts[1].trim().split(' ');

            if (dateParts.length !== 3) {
                throw new Error('Format tanggal tidak valid');
            }

            const tanggal = parseInt(dateParts[0]);
            const namaBulan = dateParts[1].trim().toLowerCase(); // ← TAMBAHKAN .toLowerCase()
            const tahun = parseInt(dateParts[2]);

            if (isNaN(tanggal) || isNaN(tahun)) {
                throw new Error('Tanggal atau tahun tidak valid');
            }

            if (!(namaHari in hariMap)) {
                throw new Error(`Nama hari tidak valid: ${namaHari}`);
            }

            if (!(namaBulan in bulanMap)) {
                throw new Error(`Nama bulan tidak valid: ${namaBulan}`);
            }

           const date = new Date(Date.UTC(tahun, bulanMap[namaBulan], tanggal, 0, 0, 0, 0));

        if (isNaN(date.getTime())) {
            throw new Error('Tanggal tidak valid');
        }

      
        const actualDayIndex = date.getUTCDay(); 
        const expectedDayIndex = hariMap[namaHari];

        if (actualDayIndex !== expectedDayIndex) {
            const actualDayName = Object.keys(hariMap).find(
                key => hariMap[key] === actualDayIndex
            );
            throw new Error(
                `Tanggal ${tanggal} ${namaBulan} ${tahun} jatuh pada hari ${actualDayName}, bukan ${namaHari}`
            );
        }

            return date;

        } catch (error) {
            throw new BadRequestException(
                error.message || 'Format tanggal tidak valid. Gunakan format: "Senin, 12 Januari 2026"'
            );
        }
    }

    private formatTanggalToString(date: Date): string {
        const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const bulanNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

    const hari = hariNames[date.getUTCDay()];
    const tanggal = date.getUTCDate();
    const bulan = bulanNames[date.getUTCMonth()]; 
    const tahun = date.getUTCFullYear(); 


        return `${hari}, ${tanggal} ${bulan} ${tahun}`;
    }
}