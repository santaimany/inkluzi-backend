import { ApiProperty } from '@nestjs/swagger';

import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsDisabilityTypesValid } from 'src/auth/dto/validators/disability-types.validator';

export class UpdateDisabilityTypeDto {
  @ApiProperty({
    description: 'Jenis disabilitas',
    example: 'Tunarungu',
  })
  @IsString()
  jenis_disabilitas: string;

  @ApiProperty({
    description: 'Jumlah siswa dengan jenis disabilitas tersebut',
    example: 30,
  })
  @IsString()
  jumlah_siswa: number;
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Nama instansi',
    example: 'SPPG-Kota Jakarta',
  })
  @IsOptional()
  @IsString()
  nama_instansi?: string;

  @ApiProperty({
    description: 'Wilayah kerja instansi',
    example: 'Jakarta Selatan',
  })
  @IsOptional()
  @IsString()
  wilayah_kerja?: string;

  @ApiProperty({
    description: 'Alamat instansi',
    example: 'Jl. Sudirman No. 10, Jakarta Selatan',
  })
  @IsOptional()
  @IsString()
  alamat?: string;

  @ApiProperty({
    description: 'Penanggung jawab instansi',
    example: 'Bapak Ahmad Sulaiman',
  })
  @IsOptional()
  @IsString()
  penanggung_jawab?: string;

  @ApiProperty({
    description: 'Nomor kontak instansi',
    example: '+62 812-3456-7890',
  })
  @IsOptional()
  @IsString()
  nomor_kontak?: string;

  @ApiProperty({
    description: 'Nama sekolah',
    example: 'SDN 01 Menteng',
  })
  @IsOptional()
  @IsString()
  nama_sekolah?: string;

  @ApiProperty({
    description: 'NPSN sekolah',
    example: '20104001',
  })
  @IsOptional()
  @IsString()
  npsn?: string;

  @ApiProperty({
    description: 'Jenis sekolah',
    example: 'SLB-A',
  })
  @IsOptional()
  @IsString()
  jenis_sekolah?: string;

  @ApiProperty({
    description: 'Total siswa di sekolah',
    example: 350,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  total_siswa?: number;

  @ApiProperty({
    description: 'Array jenis dan jumlah disabilitas',
    type: [UpdateDisabilityTypeDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDisabilityTypeDto)
  @IsDisabilityTypesValid()
  disability_types?: UpdateDisabilityTypeDto[];

  
}
