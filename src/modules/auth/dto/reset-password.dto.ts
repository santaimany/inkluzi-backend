import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...',
    description: 'Token reset password yang diterima via email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token tidak boleh kosong' })
  token: string;

  @ApiProperty({
    example: 'NewPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password baru tidak boleh kosong' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
  })
  new_password: string;
}
