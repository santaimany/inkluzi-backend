import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RespondReportDto {
  @ApiPropertyOptional({
    description: 'Respon dari SPPG terhadap laporan (opsional)',
    example: 'Terima kasih atas laporannya. Kami akan segera melakukan perbaikan pada menu untuk memastikan keamanan siswa dengan alergi makanan laut.',
  })
  @IsOptional()
  @IsString()
  sppg_response?: string;
}