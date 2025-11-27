import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterSppgDto } from './dto/register-sppg.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ){ }

  async registerSppg(dto: RegisterSppgDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email}
    })
    if (existingUser) {
    throw new ConflictException('Email sudah terdaftar');
  }

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
          photoUrl: dto.photo_url,
          cloudinaryPublicId: dto.cloudinary_public_id,

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
