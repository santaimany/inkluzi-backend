import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetUsersQueryDto {
  @ApiPropertyOptional({
    enum: ['sppg', 'sekolah'],
    description: 'Filter by role',
  })
  @IsOptional()
  @IsEnum(['sppg', 'sekolah'], {
    message: 'Role must be either sppg or sekolah',
  })
  role?: 'sppg' | 'sekolah';

  @ApiPropertyOptional({
    enum: ['pending', 'active', 'inactive'],
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(['pending', 'active', 'inactive'], {
    message: 'Status must be either active, inactive, or pending',
  })
  status?: 'pending' | 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'Search by email or profile name',
    example: 'malang',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must not be less than 1' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must not be less than 1' })
  limit?: number;
}