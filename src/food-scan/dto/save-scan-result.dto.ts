// dto/save-scan-result.dto.ts

import { IsString, IsNotEmpty, IsArray, IsObject, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class KomponenMenuDto {
  @ApiProperty()
  @IsString()
  nama: string;

  @ApiProperty()
  @IsString()
  porsi: string;
}

class KandunganGiziDto {
  @ApiProperty()
  @IsNumber()
  kalori_total: number;

  @ApiProperty()
  @IsNumber()
  karbohidrat: number;

  @ApiProperty()
  @IsNumber()
  protein: number;

  @ApiProperty()
  @IsNumber()
  lemak: number;

  @ApiProperty()
  @IsNumber()
  gula: number;

  @ApiProperty()
  @IsNumber()
  serat: number;

  @ApiProperty()
  @IsNumber()
  sodium: number;
}

export class SaveScanResultDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  image_url: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cloudinary_public_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nama_makanan: string;

  @ApiProperty({ type: [KomponenMenuDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KomponenMenuDto)
  komponen_menu: KomponenMenuDto[];

  @ApiProperty({ type: KandunganGiziDto })
  @IsObject()
  @ValidateNested()
  @Type(() => KandunganGiziDto)
  kandungan_gizi: KandunganGiziDto;

  @ApiProperty()
  @IsObject()
  deteksi_risiko: { [kategori: string]: string[] };

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  rekomendasi?: string | null;

  @ApiProperty()
  @IsNumber()
  ml_confidence: number;
}