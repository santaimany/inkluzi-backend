import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../core/prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { EmailService } from 'src/shared/email/email.service';
import { AdminService } from '../admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: PrismaService;
  let emailService: EmailService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    schoolProfile: {
      findMany: jest.fn(),
    },
    sppgProfile: {
      findUnique: jest.fn(),
    },
  };

  const mockEmailService = {
    sendAccountActivationEmail: jest.fn(),
    sendAccountDeactivationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return paginated users without filters', async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10 };
      const mockUsers = [
        {
          id: 'user-1',
          email: 'sppg@test.com',
          role: 'sppg',
          status: 'active',
          createdAt: new Date(),
          sppgProfile: { namaInstansi: 'SPPG Test' },
          schoolProfile: null,
        },
        {
          id: 'user-2',
          email: 'school@test.com',
          role: 'sekolah',
          status: 'inactive',
          createdAt: new Date(),
          sppgProfile: null,
          schoolProfile: { namaSekolah: 'School Test' },
        },
      ];

      mockPrismaService.user.count.mockResolvedValue(2);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers(query);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { role: { not: 'admin' } },
      });
    });

    it('should filter users by role', async () => {
      const query: GetUsersQueryDto = { role: 'sppg', page: 1, limit: 10 };
      const mockUsers = [
        {
          id: 'user-1',
          email: 'sppg@test.com',
          role: 'sppg',
          status: 'active',
          createdAt: new Date(),
          sppgProfile: { namaInstansi: 'SPPG Test' },
          schoolProfile: null,
        },
      ];

      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].role).toBe('sppg');
      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { role: 'sppg' },
      });
    });

    it('should filter users by status', async () => {
      const query: GetUsersQueryDto = { status: 'active', page: 1, limit: 10 };

      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.getAllUsers(query);

      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { role: { not: 'admin' }, status: 'active' },
      });
    });

    it('should search users by email or profile name', async () => {
      const query: GetUsersQueryDto = { search: 'test', page: 1, limit: 10 };

      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.getAllUsers(query);

      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          role: { not: 'admin' },
          OR: expect.arrayContaining([
            { email: { contains: 'test', mode: 'insensitive' } },
          ]),
        }),
      });
    });

    it('should handle pagination correctly', async () => {
      const query: GetUsersQueryDto = { page: 2, limit: 5 };

      mockPrismaService.user.count.mockResolvedValue(12);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getAllUsers(query);

      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(3);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });

    it('should return correct profile name for SPPG users', async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10 };
      const mockUsers = [
        {
          id: 'user-1',
          email: 'sppg@test.com',
          role: 'sppg',
          status: 'active',
          createdAt: new Date(),
          sppgProfile: { namaInstansi: 'SPPG Jakarta' },
          schoolProfile: null,
        },
      ];

      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers(query);

      expect(result.data[0].profile_name).toBe('SPPG Jakarta');
    });

    it('should return correct profile name for school users', async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10 };
      const mockUsers = [
        {
          id: 'user-2',
          email: 'school@test.com',
          role: 'sekolah',
          status: 'active',
          createdAt: new Date(),
          sppgProfile: null,
          schoolProfile: { namaSekolah: 'SDN 01 Jakarta' },
        },
      ];

      mockPrismaService.user.count.mockResolvedValue(1);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getAllUsers(query);

      expect(result.data[0].profile_name).toBe('SDN 01 Jakarta');
    });
  });

  describe('getUserDetail', () => {
    it('should return SPPG user detail with assigned schools', async () => {
      const userId = 'sppg-user-1';
      const mockUser = {
        id: userId,
        email: 'sppg@test.com',
        role: 'sppg',
        status: 'active',
        createdAt: new Date(),
        sppgProfile: {
          id: 'sppg-profile-1',
          namaInstansi: 'SPPG Jakarta',
          wilayahKerja: 'Jakarta Pusat',
          alamat: 'Jl. Test No. 1',
          penanggungJawab: 'John Doe',
          nomorKontak: '081234567890',
          photoUrl: 'https://example.com/photo.jpg',
        },
        schoolProfile: null,
      };

      const mockSchools = [
        {
          id: 'school-1',
          namaSekolah: 'SDN 01',
          npsn: '12345678',
          jenisSekolah: 'SD',
        },
        {
          id: 'school-2',
          namaSekolah: 'SDN 02',
          npsn: '87654321',
          jenisSekolah: 'SD',
        },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.schoolProfile.findMany.mockResolvedValue(mockSchools);

      const result = await service.getUserDetail(userId);

      expect(result.id).toBe(userId);
      expect(result.role).toBe('sppg');
      expect(result.profile_data.nama_instansi).toBe('SPPG Jakarta');
      expect(result.profile_data.schools).toHaveLength(2);
      expect(result.profile_data.schools[0].nama_sekolah).toBe('SDN 01');
    });

    it('should return school user detail with SPPG assignment', async () => {
      const userId = 'school-user-1';
      const mockUser = {
        id: userId,
        email: 'school@test.com',
        role: 'sekolah',
        status: 'active',
        createdAt: new Date(),
        sppgProfile: null,
        schoolProfile: {
          id: 'school-profile-1',
          namaSekolah: 'SDN 01 Jakarta',
          npsn: '12345678',
          jenisSekolah: 'SD',
          alamat: 'Jl. Sekolah No. 1',
          totalSiswa: 500,
          penanggungJawab: 'Jane Doe',
          nomorKontak: '081234567890',
          photoUrl: 'https://example.com/school.jpg',
          sppgId: 'sppg-profile-1',
          disabilityTypes: [
            { jenisDisabilitas: 'Autis', jumlahSiswa: 10 },
            { jenisDisabilitas: 'Tuna Rungu', jumlahSiswa: 5 },
          ],
        },
      };

      const mockSppg = {
        id: 'sppg-profile-1',
        namaInstansi: 'SPPG Jakarta',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.sppgProfile.findUnique.mockResolvedValue(mockSppg);

      const result = await service.getUserDetail(userId);

      expect(result.id).toBe(userId);
      expect(result.role).toBe('sekolah');
      expect(result.profile_data.nama_sekolah).toBe('SDN 01 Jakarta');
      expect(result.profile_data.sppg.nama_instansi).toBe('SPPG Jakarta');
      expect(result.profile_data.disability_types).toHaveLength(2);
    });

    it('should return school detail without SPPG if not assigned', async () => {
      const userId = 'school-user-1';
      const mockUser = {
        id: userId,
        email: 'school@test.com',
        role: 'sekolah',
        status: 'active',
        createdAt: new Date(),
        sppgProfile: null,
        schoolProfile: {
          id: 'school-profile-1',
          namaSekolah: 'SDN 01 Jakarta',
          npsn: '12345678',
          jenisSekolah: 'SD',
          alamat: 'Jl. Sekolah No. 1',
          totalSiswa: 500,
          penanggungJawab: 'Jane Doe',
          nomorKontak: '081234567890',
          photoUrl: null,
          sppgId: null,
          disabilityTypes: [],
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserDetail(userId);

      expect(result.profile_data.sppg).toBeNull();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserDetail('non-existent-id')).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw ForbiddenException for admin users', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        sppgProfile: null,
        schoolProfile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.getUserDetail('admin-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status from inactive to active and send activation email', async () => {
      const userId = 'user-1';
      const dto: UpdateUserStatusDto = { status: 'active' };
      const mockUser = {
        id: userId,
        email: 'sppg@test.com',
        role: 'sppg',
        status: 'inactive',
        sppgProfile: { namaInstansi: 'SPPG Jakarta' },
        schoolProfile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        status: 'active',
      });

      const result = await service.updateUserStatus(userId, dto);

      expect(result.message).toContain('active');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { status: 'active' },
      });
      expect(emailService.sendAccountActivationEmail).toHaveBeenCalledWith(
        'sppg@test.com',
        'SPPG Jakarta',
        'sppg',
      );
    });

    it('should update user status from active to inactive and send deactivation email', async () => {
      const userId = 'user-1';
      const dto: UpdateUserStatusDto = { status: 'inactive' };
      const mockUser = {
        id: userId,
        email: 'school@test.com',
        role: 'sekolah',
        status: 'active',
        sppgProfile: null,
        schoolProfile: { namaSekolah: 'SDN 01' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        status: 'inactive',
      });

      const result = await service.updateUserStatus(userId, dto);

      expect(result.message).toContain('inactive');
      expect(emailService.sendAccountDeactivationEmail).toHaveBeenCalledWith(
        'school@test.com',
        'SDN 01',
        'sekolah',
      );
    });

    it('should not send email if status unchanged', async () => {
      const userId = 'user-1';
      const dto: UpdateUserStatusDto = { status: 'active' };
      const mockUser = {
        id: userId,
        email: 'sppg@test.com',
        role: 'sppg',
        status: 'active',
        sppgProfile: { namaInstansi: 'SPPG Jakarta' },
        schoolProfile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await service.updateUserStatus(userId, dto);

      expect(emailService.sendAccountActivationEmail).not.toHaveBeenCalled();
      expect(emailService.sendAccountDeactivationEmail).not.toHaveBeenCalled();
    });

    it('should use email as fallback if profile name not available', async () => {
      const userId = 'user-1';
      const dto: UpdateUserStatusDto = { status: 'active' };
      const mockUser = {
        id: userId,
        email: 'user@test.com',
        role: 'sppg',
        status: 'inactive',
        sppgProfile: null,
        schoolProfile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        status: 'active',
      });

      await service.updateUserStatus(userId, dto);

      expect(emailService.sendAccountActivationEmail).toHaveBeenCalledWith(
        'user@test.com',
        'user@test.com',
        'sppg',
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserStatus('non-existent-id', { status: 'active' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for admin users', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        status: 'active',
        sppgProfile: null,
        schoolProfile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.updateUserStatus('admin-1', { status: 'inactive' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteUser', () => {
    it('should successfully delete a user', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        email: 'user@test.com',
        role: 'sppg',
        status: 'active',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteUser(userId);

      expect(result.message).toBe('User berhasil dihapus');
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteUser('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when trying to delete admin user', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'admin',
        status: 'active',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.deleteUser('admin-1')).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockPrismaService.user.delete).not.toHaveBeenCalled();
    });
  });
});
