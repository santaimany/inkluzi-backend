import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

import { ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { RegisterSppgDto } from './dto/register-sppg.dto';
import { RegisterSekolahDto } from './dto/register-sekolah.dto';
import { LoginDto } from './dto/login.dto';

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

  @Post('register/sekolah')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register Sekolah',
    description: 'Registrasi akun Sekolah baru. Status awal: pending (perlu approval admin)'
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
  async registerSekolah(@Body() dto: RegisterSekolahDto) {
    return await this.authService.registerSekolah(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User Login',
    description: 'Autentikasi user dan mendapatkan access token serta refresh token'
  })
  @SwaggerResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            user_id: 'uuid-of-user',
            email: 'string',
            role: 'sppg | sekolah',
            status: 'active | pending | inactive',
            sppgProfile: { /* jika role sppg */ },
            schoolProfile: { /* jika role sekolah */ }
          },
          access_token: 'jwt-access-token',
          refresh_token: 'jwt-refresh-token'
        }
      }
    }
  })
  @SwaggerResponse({ status: 401, description: 'Email atau password salah' })
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }


}
