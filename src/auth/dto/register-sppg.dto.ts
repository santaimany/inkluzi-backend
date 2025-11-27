import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber, IsUrl } from 'class-validator';
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
  nama_sppg: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No. 123, Jakarta Pusat' })
  @IsOptional()
  @IsString()
  alamat?: string;

  @ApiPropertyOptional({ example: '+6281234567890' })
  @IsOptional()
  @IsPhoneNumber('ID')
  nomor_telepon?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @ApiPropertyOptional({ example: 'public-id-123' })
  @IsOptional()
  @IsString()
  logo_cloudinary_public_id?: string;
}