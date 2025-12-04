import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayMinSize, IsArray, IsUUID } from "class-validator";


export class AssignSchoolsDto {
    @ApiProperty({
        type: [String],
        description: 'Array of school IDs to be assigned',
        example: ['uuid-1', 'uuid-2', 'uuid-3'],
    })
    @Transform(({ value }) => {
    // Convert string to array jika user kirim string
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID("4", { each: true })
    school_ids: string[];
}