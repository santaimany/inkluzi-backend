import { ApiProperty } from '@nestjs/swagger';

class DonutChartItemDto {
  @ApiProperty({ example: 67.0, description: 'Persentase kontribusi makronutrien' })
  persentase: number;

  @ApiProperty({ example: 'Karbohidrat\n67.0%', description: 'Label untuk chart' })
  label: string;
}

class DonutChartDto {
  @ApiProperty({ type: DonutChartItemDto })
  karbohidrat: DonutChartItemDto;

  @ApiProperty({ type: DonutChartItemDto })
  protein: DonutChartItemDto;

  @ApiProperty({ type: DonutChartItemDto })
  lemak: DonutChartItemDto;

  @ApiProperty({ type: DonutChartItemDto })
  lainnya: DonutChartItemDto;
}

class InfoNutrisiDto {
  @ApiProperty({ example: 540, description: 'Total kalori menu' })
  total_kalori: number;

  @ApiProperty({ example: '448 gram/porsi', description: 'Total porsi menu' })
  total_porsi: string;

  @ApiProperty({ type: DonutChartDto, description: 'Data untuk donut chart' })
  donut_chart: DonutChartDto;
}

class AkgItemDto {
  @ApiProperty({ example: 'Kalori', description: 'Label nutrisi' })
  label: string;

  @ApiProperty({ example: '23% Nilai Harian', description: 'Persentase AKG' })
  nilai: string;
}

class PersentaseAkgDto {
  @ApiProperty({ type: AkgItemDto })
  kalori: AkgItemDto;

  @ApiProperty({ type: AkgItemDto })
  karbohidrat: AkgItemDto;

  @ApiProperty({ type: AkgItemDto })
  protein: AkgItemDto;

  @ApiProperty({ type: AkgItemDto })
  lemak: AkgItemDto;

  @ApiProperty({ type: AkgItemDto })
  serat: AkgItemDto;

  @ApiProperty({ type: AkgItemDto })
  gula: AkgItemDto;

  @ApiProperty({ type: AkgItemDto })
  sodium: AkgItemDto;
}

class NutrisiItemDto {
  @ApiProperty({ example: '42.0g', description: 'Nilai nutrisi dengan satuan' })
  nilai: string;

  @ApiProperty({ example: 'Karbohidrat', description: 'Label nutrisi' })
  label: string;
}

class KomponenNutrisiDto {
  @ApiProperty({ type: NutrisiItemDto })
  karbohidrat: NutrisiItemDto;

  @ApiProperty({ type: NutrisiItemDto })
  protein: NutrisiItemDto;

  @ApiProperty({ type: NutrisiItemDto })
  lemak: NutrisiItemDto;

  @ApiProperty({ type: NutrisiItemDto })
  gula: NutrisiItemDto;

  @ApiProperty({ type: NutrisiItemDto })
  serat: NutrisiItemDto;

  @ApiProperty({ type: NutrisiItemDto })
  sodium: NutrisiItemDto;
}

class KomponenDetailDto {
  @ApiProperty({ example: 'Nasi Putih', description: 'Nama komponen menu' })
  nama: string;

  @ApiProperty({ example: '150 gram', description: 'Berat komponen' })
  berat: string;

  @ApiProperty({ example: 195, description: 'Kalori komponen' })
  kalori: number;

  @ApiProperty({ example: 'kkal Kalori', description: 'Satuan kalori' })
  satuan_kalori: string;

  @ApiProperty({ type: KomponenNutrisiDto, description: 'Detail nutrisi komponen' })
  nutrisi: KomponenNutrisiDto;
}

class TetapanAkgDto {
  @ApiProperty({ example: '2000 kkal' })
  energi: string;

  @ApiProperty({ example: '300 g' })
  karbohidrat: string;

  @ApiProperty({ example: '66 g' })
  protein: string;

  @ApiProperty({ example: '65 g' })
  lemak: string;

  @ApiProperty({ example: '30 g' })
  serat: string;

  @ApiProperty({ example: '2300 mg' })
  sodium: string;
}

class InformasiAkgDto {
  @ApiProperty({
    example: 'AKG (Angka Kecukupan Gizi) adalah acuan jumlah energi dan zat gizi yang sebaiknya dikonsumsi seseorang setiap hari sesuai usia dan kondisi tubuh.',
    description: 'Pengertian AKG'
  })
  pengertian: string;

  @ApiProperty({
    example: 'Persentase AKG menunjukkan seberapa besar kontribusi satu porsi menu terhadap kebutuhan harian...',
    description: 'Fungsi AKG'
  })
  fungsi: string;

  @ApiProperty({ type: TetapanAkgDto, description: 'Nilai standar AKG' })
  tetapan_akg: TetapanAkgDto;
}

export class NutritionDetailResponseDto {
  @ApiProperty({ example: 'uuid', description: 'ID menu' })
  menu_id: string;

  @ApiProperty({ example: 'Nasi Sayur Capcay Ayam', description: 'Nama menu' })
  nama_menu: string;

  @ApiProperty({
    example: 'Menu Nasi Sayur Capcay Ayam adalah satu porsi yang terdiri dari nasi putih, capcay ayam...',
    description: 'Deskripsi lengkap menu dan manfaatnya'
  })
  deskripsi: string;

  @ApiProperty({ type: InfoNutrisiDto, description: 'Informasi nutrisi utama' })
  info_nutrisi: InfoNutrisiDto;

  @ApiProperty({ type: PersentaseAkgDto, description: 'Persentase AKG per nutrisi' })
  persentase_akg: PersentaseAkgDto;

  @ApiProperty({ type: [KomponenDetailDto], description: 'Detail nutrisi per komponen menu' })
  komponen_detail: KomponenDetailDto[];

  @ApiProperty({ type: InformasiAkgDto, description: 'Informasi tentang AKG' })
  informasi_akg: InformasiAkgDto;
}