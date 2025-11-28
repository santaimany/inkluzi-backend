import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterSppgDto } from './dto/register-sppg.dto';
import { RegisterSekolahDto } from './dto/register-sekolah.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ){ }

  async registerSppg(dto: RegisterSppgDto) {
   await this.checkEmailAvailability(dto.email);

  const hashedPassword = await bcrypt.hash(dto.password, 10);

  const user = await this.prisma.user.create({
    data: {
      email: dto.email,
      passwordHash: hashedPassword,
      role: 'sppg',
      status: 'pending',
      sppgProfile: {
        create: {
          namaInstansi: dto.nama_instansi,
          wilayahKerja: dto.wilayah_kerja,
          alamat: dto.alamat,
          penanggungJawab: dto.penanggung_jawab,
          nomorKontak: dto.nomor_kontak,
        },
      },
    },
  });

  return {
    success: true,
      message: 'User registered successfully',
      data: {
        user_id: user.id,
        status: user.status,
      },
  }
  }

  async registerSekolah(dto: RegisterSekolahDto) {
    await this.checkEmailAvailability(dto.email);
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const existingNpsn = await this.prisma.schoolProfile.findUnique({
      where: { npsn: dto.npsn }
    })

    if(existingNpsn) {
      throw new ConflictException('NPSN sudah terdaftar');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        role: 'sekolah',
        status: 'pending',
        schoolProfile: {
          create: {
            namaSekolah: dto.nama_sekolah,
            npsn: dto.npsn,
            jenisSekolah: dto.jenis_sekolah,
            alamat: dto.alamat,
            totalSiswa: dto.total_siswa,
            penanggungJawab: dto.penanggung_jawab,
            nomorKontak: dto.nomor_kontak,
            disabilityTypes: {
              create: dto.disability_types.map((dt) => ({
                jenisDisabilitas: dt.jenis_disabilitas,
                jumlahSiswa: dt.jumlah_siswa,
              })),
            },
          },
        },
      },
    });

     return {
    success: true,
      message: 'User registered successfully',
      data: {
        user_id: user.id,
        status: user.status,
      },
  }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email},
      include: {
        sppgProfile: true,
        schoolProfile: true,
      },
    });

    if(!user){
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if(!isPasswordValid){
      throw new UnauthorizedException('Email atau password salah');
    }
    if(user.status !== 'active') {
      throw new UnauthorizedException('Akun belum diverifikasi. Silakan tunggu konfirmasi dari admin.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

      const userData: any = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.createdAt.toISOString(),
    };


    return {
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
    }
  }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken,{
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { 
          token: refreshToken,
          userId: payload.sub,
          expiresAt: {
            gt: new Date(),
          }
        },
      })

      if(!storedToken){
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const tokens = await this.generateTokens(payload.sub, payload.email, payload.role); 
      await this.prisma.refreshToken.delete({
        where: {id: storedToken.id},
      });
      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        },
      }

    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token' + error.message);
    }
  }

  async logout(userId: string, refreshToken: string) {
     if(!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
     const storedToken = await this.prisma.refreshToken.findFirst({
    where: {
      userId: userId,
      token: refreshToken,
      expiresAt: {
        gt: new Date(), // Token belum expired
      }
    }
  });

  if (!storedToken) {
    throw new UnauthorizedException('Refresh token tidak valid atau sudah logout');
  }

  await this.prisma.refreshToken.delete({
    where: {
      id: storedToken.id,
    }
  });
   

    return {
      success: true,
      message: 'Logout successful',
    }
  }


  //+++++++++++++++++++++++++++++++++++
  // Helper Methods
  //+++++++++++++++++++++++++++++++++++

  private async checkEmailAvailability(email: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Email sudah terdaftar');
  }

  
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessExpiresIn = this.configService.get('JWT_EXPIRES_IN') || '15m';
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshExpiresIn,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: userId,
        expiresAt: expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    }
    
  }
}
