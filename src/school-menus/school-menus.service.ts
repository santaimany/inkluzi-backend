import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetMenusQueryDto } from './dto/get-menus-query.dto';

@Injectable()
export class SchoolMenusService {
  constructor(private prisma: PrismaService) {}

  private parseTanggalString(tanggalStr: string): Date {
    const hariMap = {
      minggu: 0,
      senin: 1,
      selasa: 2,
      rabu: 3,
      kamis: 4,
      jumat: 5,
      sabtu: 6,
    };

    const bulanMap = {
      januari: 0,
      februari: 1,
      maret: 2,
      april: 3,
      mei: 4,
      juni: 5,
      juli: 6,
      agustus: 7,
      september: 8,
      oktober: 9,
      november: 10,
      desember: 11,
    };

    const parts = tanggalStr.split(',').map((p) => p.trim());
    const namaHari = parts[0].toLowerCase();
    const dateParts = parts[1].split(' ');
    const tanggal = parseInt(dateParts[0], 10);
    const namaBulan = dateParts[1].toLowerCase();
    const tahun = parseInt(dateParts[2], 10);

    const bulan = bulanMap[namaBulan];
    const expectedHari = hariMap[namaHari];

    if (bulan === undefined || expectedHari === undefined) {
      throw new Error('Nama hari atau bulan tidak valid');
    }

    const date = new Date(Date.UTC(tahun, bulan, tanggal, 0, 0, 0, 0));
    const actualHari = date.getUTCDay();

    if (actualHari !== expectedHari) {
      throw new Error(
        `Hari tidak sesuai dengan tanggal. ${namaHari} seharusnya jatuh pada hari lain.`,
      );
    }

    return date;
  }

  // Helper: Format tanggal ke string Indonesia
  private formatTanggalToString(date: Date): string {
    const hariNames = [
      'Minggu',
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
    ];
    const bulanNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];

    const hari = hariNames[date.getUTCDay()];
    const tanggal = date.getUTCDate();
    const bulan = bulanNames[date.getUTCMonth()];
    const tahun = date.getUTCFullYear();

    return `${hari}, ${tanggal} ${bulan} ${tahun}`;
  }

  // GET LIST MENUS
  async getMenus(schoolUserId: string, query: GetMenusQueryDto) {
    // 1. Dapatkan School Profile
    const schoolProfile = await this.prisma.schoolProfile.findUnique({
      where: { userId: schoolUserId },
    });

    if (!schoolProfile) {
      throw new NotFoundException('School profile tidak ditemukan');
    }

    // 2. Build where clause
    const where: any = {
      menuAssignments: {
        some: {
          sekolahId: schoolProfile.id,
        },
      },
    };

    // Filter by month
    if (query.month) {
      const [year, month] = query.month.split('-').map(Number);
      const startDate = new Date(Date.UTC(year, month - 1, 1));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      where.tanggalDisajikan = {
        gte: startDate,
        lte: endDate,
      };
    }

    // 3. Hitung total data
    const total = await this.prisma.menu.count({ where });

    // 4. Fetch menus dengan pagination
    const menus = await this.prisma.menu.findMany({
      where,
      include: {
        sppgProfile: true,
      },
      orderBy: {
        tanggalDisajikan: 'desc',
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    // 5. Format response untuk card view
    const data = menus.map((menu) => {
      // Parse komponen menu string ke array (nama only)
      const komponenArray = menu.komponenMenu
        .split(',')
        .map((k) => k.trim().split('(')[0].trim());

      // Extract risiko umum (max 2 items)
      const deteksiRisiko = menu.deteksiRisiko as any;
      const risikoUmumRingkas: string[] = [];

      if (deteksiRisiko?.alergi && Array.isArray(deteksiRisiko.alergi)) {
        risikoUmumRingkas.push(...deteksiRisiko.alergi.slice(0, 2));
      }

      if (
        risikoUmumRingkas.length < 2 &&
        deteksiRisiko?.tekstur &&
        Array.isArray(deteksiRisiko.tekstur)
      ) {
        const remaining = 2 - risikoUmumRingkas.length;
        risikoUmumRingkas.push(...deteksiRisiko.tekstur.slice(0, remaining));
      }

      if (
        risikoUmumRingkas.length < 2 &&
        deteksiRisiko?.porsi_gizi &&
        Array.isArray(deteksiRisiko.porsi_gizi)
      ) {
        const remaining = 2 - risikoUmumRingkas.length;
        risikoUmumRingkas.push(...deteksiRisiko.porsi_gizi.slice(0, remaining));
      }

      // Extract kandungan gizi ringkas (4 key nutrients)
      const kandunganGizi = menu.kandunganGizi as any;
      const ringkasanGizi = {
        kalori: kandunganGizi?.kalori_total
          ? `${kandunganGizi.kalori_total} kkal`
          : '-',
        protein: kandunganGizi?.protein ? `${kandunganGizi.protein} g` : '-',
        lemak: kandunganGizi?.lemak ? `${kandunganGizi.lemak} g` : '-',
        serat: kandunganGizi?.serat ? `${kandunganGizi.serat} g` : '-',
      };

      return {
        id: menu.id,
        tanggal: this.formatTanggalToString(menu.tanggalDisajikan),
        nama_menu: menu.namaMenu,
        komponen_menu: komponenArray,
        risiko_umum_ringkas: risikoUmumRingkas,
        ringkasan_gizi: ringkasanGizi,
        status_keamanan: menu.statusKeamanan,
        nama_sppg: menu.sppgProfile.namaInstansi,
      };
    });

    // 6. Return dengan pagination
    return {
        status: 'success',
        message: 'Daftar menu berhasil diambil',
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        total_pages: Math.ceil(total / query.limit),
      },
    };
  }

  // GET DETAIL MENU
  async getMenuDetail(schoolUserId: string, menuId: string) {
    // 1. Dapatkan School Profile
    const schoolProfile = await this.prisma.schoolProfile.findUnique({
      where: { userId: schoolUserId },
    });

    if (!schoolProfile) {
      throw new NotFoundException('School profile tidak ditemukan');
    }

    // 2. Fetch menu dan verify assignment
    const menuAssignment = await this.prisma.menuAssignment.findFirst({
      where: {
        menuId: menuId,
        sekolahId: schoolProfile.id,
      },
      include: {
        menu: {
          include: {
            sppgProfile: true,
          },
        },
      },
    });

    if (!menuAssignment) {
      throw new NotFoundException(
        'Menu tidak ditemukan atau tidak terassign ke sekolah Anda',
      );
    }

    const menu = menuAssignment.menu;

    // 3. Parse komponen menu dari string ke array dengan porsi
    const komponenArray = menu.komponenMenu.split(',').map((item) => {
      const trimmed = item.trim();
      const match = trimmed.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
        return {
          nama: match[1].trim(),
          porsi: match[2].trim(),
        };
      }
      return {
        nama: trimmed,
        porsi: '-',
      };
    });

    // 4. Format kandungan gizi as table array
    const kandunganGizi = menu.kandunganGizi as any;
    const kandunganGiziTable = [
      {
        komponen: 'Kalori Total',
        jumlah: kandunganGizi?.kalori_total
          ? `${kandunganGizi.kalori_total} kkal`
          : '-',
      },
      {
        komponen: 'Protein',
        jumlah: kandunganGizi?.protein ? `${kandunganGizi.protein} g` : '-',
      },
      {
        komponen: 'Lemak',
        jumlah: kandunganGizi?.lemak ? `${kandunganGizi.lemak} g` : '-',
      },
      {
        komponen: 'Karbohidrat',
        jumlah: kandunganGizi?.karbohidrat
          ? `${kandunganGizi.karbohidrat} g`
          : '-',
      },
      {
        komponen: 'Serat',
        jumlah: kandunganGizi?.serat ? `${kandunganGizi.serat} g` : '-',
      },
      {
        komponen: 'Gula',
        jumlah: kandunganGizi?.gula ? `${kandunganGizi.gula} g` : '-',
      },
      {
        komponen: 'Natrium',
        jumlah: kandunganGizi?.natrium ? `${kandunganGizi.natrium} mg` : '-',
      },
    ];

    // 5. Structure deteksi risiko by category
    const deteksiRisiko = menu.deteksiRisiko as any;
    const deteksiRisikoStructured = {
      alergi: deteksiRisiko?.alergi || [],
      tekstur: deteksiRisiko?.tekstur || [],
      porsi_gizi: deteksiRisiko?.porsi_gizi || [],
    };

    // 6. Extract hari from tanggal
    const hariNames = [
      'Minggu',
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
    ];
    const hari = hariNames[menu.tanggalDisajikan.getUTCDay()];

    // 7. Check catatan tambahan from extra categories
    const allCategories = Object.keys(deteksiRisiko || {});
    const standardCategories = ['alergi', 'tekstur', 'porsi_gizi'];
    const extraCategories = allCategories.filter(
      (cat) => !standardCategories.includes(cat),
    );

    let catatanTambahan: string[] = [];
    extraCategories.forEach((cat) => {
      if (Array.isArray(deteksiRisiko[cat])) {
        catatanTambahan = catatanTambahan.concat(deteksiRisiko[cat]);
      }
    });

    // 8. Return response
    return {
        status: 'success',
        message: 'Menu detail berhasil diambil',
      data: {
        id: menu.id,
        hari: hari,
        tanggal: this.formatTanggalToString(menu.tanggalDisajikan),
        nama_menu: menu.namaMenu,
        komponen_menu: komponenArray,
        kandungan_gizi: kandunganGiziTable,
        deteksi_risiko: deteksiRisikoStructured,
        rekomendasi: menu.rekomendasi,
        status_keamanan: menu.statusKeamanan,
        ml_confidence: menu.mlConfidence,
        catatan_tambahan: catatanTambahan.length > 0 ? catatanTambahan : null,
        sppg: {
          id: menu.sppgProfile.id,
          nama_instansi: menu.sppgProfile.namaInstansi,
          penanggung_jawab: menu.sppgProfile.penanggungJawab,
          nomor_kontak: menu.sppgProfile.nomorKontak,
        },
      },
    };
  }
}