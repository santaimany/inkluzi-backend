import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

import { ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { RegisterSppgDto } from './dto/register-sppg.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/sppg')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register SPPG',
    description: 'Registrasi akun SPPG baru. Status awal: pending (perlu approval admin)'
  })
  @SwaggerResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        message: 'User registered successfully',
        data: {
          user_id: 'uuid-of-new-user',
          status: 'pending'
        }
      }
    }
  })
  @SwaggerResponse({ status: 409, description: 'Email sudah terdaftar' })
  async registerSppg(@Body() dto: RegisterSppgDto) {
    return this.authService.registerSppg(dto);
  }


}
