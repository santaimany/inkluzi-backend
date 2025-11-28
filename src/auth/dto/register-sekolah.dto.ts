import { IsEmail, IsString, MinLength, IsOptional, IsUrl, IsUUID, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDisabilityTypesValid } from './validators/disability-types.validator';


export class DisabilityTypeDto {
  @ApiProperty({
    example: 'Tunarungu'
  })
  @IsString()
  jenis_disabilitas: string;

  @ApiProperty({
    example: 25
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  jumlah_siswa: number;
}
export class RegisterSekolahDto {
  @ApiProperty({ example: 'sekolah@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  sppg_id?: string;

  @ApiProperty({ example: 'SDN 01 Menteng' })
  @IsString()
  nama_sekolah: string;

  @ApiProperty({ example: '20104001' })
  @IsString()
  npsn: string;

  @ApiProperty({ example: 'SD' })
  @IsString()
  jenis_sekolah: string;

  @ApiProperty({ example: 'Jl. Menteng Raya No. 5, Jakarta Pusat' })
  @IsString()
  alamat: string;

  @ApiProperty({ example: 350 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  total_siswa: number;

  @ApiProperty({ example: 'Ibu Siti Nurhaliza' })
  @IsString()
  penanggung_jawab: string;

  @ApiProperty({ example: '+6281234567891' })
  @IsString()
  nomor_kontak: string;

  @ApiProperty({
    type: [DisabilityTypeDto],
    example: [
      { jenis_disabilitas: 'Tunarungu', jumlah_siswa: 25 }, 
      { jenis_disabilitas: 'Tunadaksa', jumlah_siswa: 10 },]
  })
  @IsArray()
  @ValidateNested({
    each: true,
  })
  @Type(() => DisabilityTypeDto)
  @IsDisabilityTypesValid()
  disability_types: DisabilityTypeDto[];

  @IsOptional()
  @IsUrl()
  photo_url?: string;

  @IsOptional()
  @IsString()
  cloudinary_public_id?: string;
}
