import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsUUID } from "class-validator";


export class AssignSchoolsDto {
    @ApiProperty({
        type: [String],
        description: 'Array of school IDs to be assigned',
        example: ['uuid-1', 'uuid-2', 'uuid-3'],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID("4", { each: true })
    school_ids: string[];
}