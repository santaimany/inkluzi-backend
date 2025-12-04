import { IsOptional, IsInt, Min, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetMenusQueryDto {
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
    description: 'Filter berdasarkan bulan (format: YYYY-MM)',
    example: '2026-01',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'Format month harus YYYY-MM (contoh: 2026-01)',
  })
  month?: string;
}