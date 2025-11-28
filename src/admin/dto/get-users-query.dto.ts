import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";


export class GetUsersQueryDto {
    @ApiProperty({
        enum: ['sppg', 'sekolah'],
        description: 'Filter users by role',
    })
    @IsOptional()
    @IsEnum(['sppg', 'sekolah'], {
        message: 'Role must be either sppg or sekolah',
    })
    role?: 'sppg' | 'sekolah';

    @ApiProperty({
        enum: ['active', 'inactive', 'pending'],
        description: 'Filter users by status',
    })
    @IsOptional()
    @IsEnum(['active', 'inactive', 'pending'], {
        message: 'Status must be either active, inactive, or pending',
    })
    status?: 'active' | 'inactive' | 'pending';

    @ApiProperty({
        description: 'Search users by email or name',
        example: 'example',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiProperty({
        description: 'Page number for pagination',
        minimum: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({
        description: 'Number of users per page',
        default: 10,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}