import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetReportsQueryDto {
  @ApiPropertyOptional({
    description: 'Nomor halaman',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Jumlah data per halaman',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan status laporan',
    enum: ['processing', 'completed'],
    example: 'processing',
  })
  @IsOptional()
  @IsEnum(['processing', 'completed'])
  status?: 'processing' | 'completed';
}