import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterSppgDto } from '../dto/register-sppg.dto';
import { RegisterSekolahDto } from '../dto/register-sekolah.dto';
import { LoginDto } from '../dto/login.dto';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    schoolProfile: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerSppg', () => {
    const registerDto: RegisterSppgDto = {
      email: 'sppg@test.com',
      password: 'Password123!',
      nama_instansi: 'SPPG Jakarta',
      wilayah_kerja: 'Jakarta Pusat',
      alamat: 'Jl. Test No. 1',
      penanggung_jawab: 'John Doe',
      nomor_kontak: '081234567890',
    };

    it('should successfully register a new SPPG user', async () => {
      const hashedPassword = 'hashed_password';
      const createdUser = {
        id: 'user-id-1',
        email: registerDto.email,
        passwordHash: hashedPassword,
        role: 'sppg',
        status: 'pending',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.registerSppg(registerDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User registered successfully');
      expect(result.data.user_id).toBe('user-id-1');
      expect(result.data.status).toBe('pending');
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: registerDto.email,
          passwordHash: hashedPassword,
          role: 'sppg',
          status: 'pending',
        }),
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: registerDto.email,
      });

      await expect(service.registerSppg(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.registerSppg(registerDto)).rejects.toThrow(
        'Email sudah terdaftar',
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should create SPPG profile with correct data', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-id',
        status: 'pending',
      });

      await service.registerSppg(registerDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          passwordHash: 'hashed_password',
          role: 'sppg',
          status: 'pending',
          sppgProfile: {
            create: {
              namaInstansi: registerDto.nama_instansi,
              wilayahKerja: registerDto.wilayah_kerja,
              alamat: registerDto.alamat,
              penanggungJawab: registerDto.penanggung_jawab,
              nomorKontak: registerDto.nomor_kontak,
            },
          },
        },
      });
    });
  });

  describe('registerSekolah', () => {
    const registerDto: RegisterSekolahDto = {
      email: 'school@test.com',
      password: 'Password123!',
      nama_sekolah: 'SDN 01 Jakarta',
      npsn: '12345678',
      jenis_sekolah: 'SD',
      alamat: 'Jl. Sekolah No. 1',
      total_siswa: 500,
      penanggung_jawab: 'Jane Doe',
      nomor_kontak: '081234567890',
      disability_types: [
        { jenis_disabilitas: 'Autis', jumlah_siswa: 10 },
        { jenis_disabilitas: 'Tuna Rungu', jumlah_siswa: 5 },
      ],
    };

    it('should successfully register a new school user', async () => {
      const hashedPassword = 'hashed_password';
      const createdUser = {
        id: 'user-id-2',
        email: registerDto.email,
        passwordHash: hashedPassword,
        role: 'sekolah',
        status: 'pending',
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.schoolProfile.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.registerSekolah(registerDto);

      expect(result.success).toBe(true);
      expect(result.data.user_id).toBe('user-id-2');
      expect(result.data.status).toBe('pending');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
      });

      await expect(service.registerSekolah(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.registerSekolah(registerDto)).rejects.toThrow(
        'Email sudah terdaftar',
      );
    });

    it('should throw ConflictException if NPSN already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.schoolProfile.findUnique.mockResolvedValue({
        id: 'existing-school',
        npsn: registerDto.npsn,
      });

      await expect(service.registerSekolah(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.registerSekolah(registerDto)).rejects.toThrow(
        'NPSN sudah terdaftar',
      );
    });

    it('should create school profile with disability types', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.schoolProfile.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-id',
        status: 'pending',
      });

      await service.registerSekolah(registerDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: registerDto.email,
          role: 'sekolah',
          status: 'pending',
          schoolProfile: {
            create: expect.objectContaining({
              namaSekolah: registerDto.nama_sekolah,
              npsn: registerDto.npsn,
              disabilityTypes: {
                create: [
                  { jenisDisabilitas: 'Autis', jumlahSiswa: 10 },
                  { jenisDisabilitas: 'Tuna Rungu', jumlahSiswa: 5 },
                ],
              },
            }),
          },
        }),
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'user@test.com',
      password: 'Password123!',
    };

    it('should successfully login with valid credentials', async () => {
      const user = {
        id: 'user-id-1',
        email: loginDto.email,
        passwordHash: 'hashed_password',
        role: 'sppg',
        status: 'active',
        createdAt: new Date(),
        sppgProfile: { namaInstansi: 'SPPG Jakarta' },
        schoolProfile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce('access_token_123')
        .mockReturnValueOnce('refresh_token_456');
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-id',
      });

      const result = await service.login(loginDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(result.data.user.id).toBe('user-id-1');
      expect(result.data.access_token).toBe('access_token_123');
      expect(result.data.refresh_token).toBe('refresh_token_456');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Email atau password salah',
      );
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const user = {
        id: 'user-id',
        email: loginDto.email,
        passwordHash: 'hashed_password',
        status: 'active',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Email atau password salah',
      );
    });

    it('should throw UnauthorizedException if user status is not active', async () => {
      const user = {
        id: 'user-id',
        email: loginDto.email,
        passwordHash: 'hashed_password',
        status: 'pending',
        role: 'sppg',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Akun belum diverifikasi',
      );
    });

    it('should throw UnauthorizedException if user status is inactive', async () => {
      const user = {
        id: 'user-id',
        email: loginDto.email,
        passwordHash: 'hashed_password',
        status: 'inactive',
        role: 'sppg',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should generate and store refresh token', async () => {
      const user = {
        id: 'user-id',
        email: loginDto.email,
        passwordHash: 'hashed_password',
        role: 'sppg',
        status: 'active',
        createdAt: new Date(),
        sppgProfile: null,
        schoolProfile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.login(loginDto);

      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          token: 'refresh_token',
          userId: 'user-id',
          expiresAt: expect.any(Date),
        }),
      });
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      const refreshToken = 'valid_refresh_token';
      const payload = {
        sub: 'user-id',
        email: 'user@test.com',
        role: 'sppg',
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: refreshToken,
        userId: 'user-id',
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockJwtService.sign
        .mockReturnValueOnce('new_access_token')
        .mockReturnValueOnce('new_refresh_token');
      mockPrismaService.refreshToken.delete.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshToken(refreshToken);

      expect(result.success).toBe(true);
      expect(result.data.access_token).toBe('new_access_token');
      expect(result.data.refresh_token).toBe('new_refresh_token');
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token not found in DB', async () => {
      const refreshToken = 'invalid_token';
      const payload = {
        sub: 'user-id',
        email: 'user@test.com',
        role: 'sppg',
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if JWT verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        service.refreshToken('invalid_token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should delete old refresh token and create new one', async () => {
      const refreshToken = 'valid_refresh_token';
      const payload = {
        sub: 'user-id',
        email: 'user@test.com',
        role: 'sppg',
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'old-token-id',
        token: refreshToken,
      });
      mockJwtService.sign.mockReturnValue('new_token');
      mockPrismaService.refreshToken.delete.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.refreshToken(refreshToken);

      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'old-token-id' },
      });
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should successfully logout user with valid refresh token', async () => {
      const userId = 'user-id';
      const refreshToken = 'valid_refresh_token';

      mockPrismaService.refreshToken.findFirst.mockResolvedValue({
        id: 'token-id',
        token: refreshToken,
        userId: userId,
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockPrismaService.refreshToken.delete.mockResolvedValue({});

      const result = await service.logout(userId, refreshToken);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Logout successful');
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { id: 'token-id' },
      });
    });

    it('should throw UnauthorizedException if refresh token not provided', async () => {
      await expect(service.logout('user-id', null)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.logout('user-id', '')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      const userId = 'user-id';
      const refreshToken = 'invalid_token';

      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.logout(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.logout(userId, refreshToken)).rejects.toThrow(
        'Refresh token tidak valid atau sudah logout',
      );
    });

    it('should throw UnauthorizedException if token expired', async () => {
      const userId = 'user-id';
      const refreshToken = 'expired_token';

      // findFirst akan return null karena expiresAt condition
      mockPrismaService.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.logout(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});