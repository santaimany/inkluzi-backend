import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({
    description: 'ID menu yang dilaporkan',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  menu_id: string; 

  @ApiProperty({
    description: 'Catatan detail mengenai pelaporan',
    example: 'Menu yang disajikan hari ini mengandung seafood yang memicu reaksi alergi pada 2 siswa dengan autisme. Mohon untuk menghindari seafood pada menu selanjutnya.',
  })
  @IsNotEmpty()
  @IsString()
  catatan: string;

  @ApiPropertyOptional({
    description: 'Foto menu makanan (opsional)',
    type: 'string',
    format: 'binary',
  })
  @IsOptional()
  photo_url?: any;
}