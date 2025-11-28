import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";


export class UpdateUserStatusDto {
    @ApiProperty({
        enum: ['active', 'inactive'],
        description: 'The status of the user',
        example: 'active',
    })
    @IsEnum(['active', 'inactive'], {
        message: 'Status must be either active or inactive',
    })
    status: 'active' | 'inactive';
}