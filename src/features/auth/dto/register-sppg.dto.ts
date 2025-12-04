import { IsEmail, IsString, MinLength, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterSppgDto {
  @ApiProperty({ example: 'sppg@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'SPPG Jakarta Pusat' })
  @IsString()
  nama_instansi: string;

  @ApiProperty({
    example: 'Jakarta Pusat',
  })
  @IsString()
  wilayah_kerja: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No. 123, Jakarta Pusat' })
  @IsOptional()
  @IsString()
  alamat: string;

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  penanggung_jawab: string;

  @ApiProperty({ example: '+6281234567890' })
  @IsString()
  nomor_kontak: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/demo/image/upload/logo.png' })
  @IsOptional()
  @IsUrl()
  photo_url?: string;

  @ApiPropertyOptional({ example: 'mbg/logos/sppg_123' })
  @IsOptional()
  @IsString()
  cloudinary_public_id?: string;
}