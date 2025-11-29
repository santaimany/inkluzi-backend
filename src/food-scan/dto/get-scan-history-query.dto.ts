import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";


export class GetScanHistoryQueryDto {
    
    @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1) 
    page?: number;

    @ApiPropertyOptional({ 
    description: 'Jumlah data per halaman',
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
    limit?: number;
}