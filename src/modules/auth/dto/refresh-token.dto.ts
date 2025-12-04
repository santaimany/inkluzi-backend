import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";


export class RefreshTokenDto {
    @ApiProperty({
        example: 'some-refresh-token-string',
        description: 'The refresh token issued during login',
    })
    @IsString()
    @IsNotEmpty()
    refresh_token: string;
}