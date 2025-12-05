import { Test, TestingModule } from '@nestjs/testing';
import { AdminAssignService } from '../admin-assign.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignSchoolsDto } from '../dto/assign-schools.dto';

describe('AdminAssignService', () => {
  let service: AdminAssignService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    schoolProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAssignService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminAssignService>(AdminAssignService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignSchoolsToSppg', () => {
    it('should successfully assign schools to SPPG', async () => {
      const sppgId = 'sppg-user-1';
      const dto: AssignSchoolsDto = {
        school_ids: ['school-1', 'school-2'],
      };

      const mockSppgUser = {
        id: sppgId,
        email: 'sppg@test.com',
        role: 'sppg',
        sppgProfile: {
          id: 'sppg-profile-1',
          namaInstansi: 'SPPG Jakarta',
        },
      };

      const mockSchools = [
        {
          id: 'school-profile-1',
          namaSekolah: 'SDN 01',
          sppgId: null,
        },
        {
          id: 'school-profile-2',
          namaSekolah: 'SDN 02',
          sppgId: null,
        },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockSppgUser);
      mockPrismaService.schoolProfile.findMany.mockResolvedValue(mockSchools);
      mockPrismaService.schoolProfile.updateMany.mockResolvedValue({
        count: 2,
      });

      const result = await service.assignSchoolsToSppg(sppgId, dto);

      expect(result.message).toContain('2 sekolah berhasil ditugaskan');
      expect(result.sppg.nama_instansi).toBe('SPPG Jakarta');
      expect(mockPrismaService.schoolProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: { in: dto.school_ids } },
        data: { sppgId: 'sppg-profile-1' },
      });
    });

    it('should throw NotFoundException if SPPG user not found', async () => {
      const dto: AssignSchoolsDto = {
        school_ids: ['school-1'],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignSchoolsToSppg('non-existent-id', dto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.assignSchoolsToSppg('non-existent-id', dto),
      ).rejects.toThrow('SPPG tidak ditemukan');
    });

    it('should throw NotFoundException if user is not SPPG role', async () => {
      const dto: AssignSchoolsDto = {
        school_ids: ['school-1'],
      };

      const mockUser = {
        id: 'user-1',
        email: 'school@test.com',
        role: 'sekolah',
        sppgProfile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.assignSchoolsToSppg('user-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if SPPG profile not found', async () => {
      const dto: AssignSchoolsDto = {
        school_ids: ['school-1'],
      };

      const mockUser = {
        id: 'sppg-1',
        email: 'sppg@test.com',
        role: 'sppg',
        sppgProfile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.assignSchoolsToSppg('sppg-1', dto)).rejects.toThrow(
        'Profil SPPG tidak ditemukan',
      );
    });

    it('should throw NotFoundException if some schools not found', async () => {
      const sppgId = 'sppg-user-1';
      const dto: AssignSchoolsDto = {
        school_ids: ['school-1', 'school-2', 'school-3'],
      };

      const mockSppgUser = {
        id: sppgId,
        email: 'sppg@test.com',
        role: 'sppg',
        sppgProfile: {
          id: 'sppg-profile-1',
          namaInstansi: 'SPPG Jakarta',
        },
      };

      const mockSchools = [
        {
          id: 'school-profile-1',
          namaSekolah: 'SDN 01',
          sppgId: null,
        },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockSppgUser);
      mockPrismaService.schoolProfile.findMany.mockResolvedValue(mockSchools);

      await expect(service.assignSchoolsToSppg(sppgId, dto)).rejects.toThrow(
        'Beberapa sekolah tidak ditemukan',
      );
    });

    it('should throw BadRequestException if schools already assigned to another SPPG', async () => {
      const sppgId = 'sppg-user-1';
      const dto: AssignSchoolsDto = {
        school_ids: ['school-1', 'school-2'],
      };

      const mockSppgUser = {
        id: sppgId,
        email: 'sppg@test.com',
        role: 'sppg',
        sppgProfile: {
          id: 'sppg-profile-1',
          namaInstansi: 'SPPG Jakarta',
        },
      };

      const mockSchools = [
        {
          id: 'school-profile-1',
          namaSekolah: 'SDN 01',
          sppgId: 'other-sppg-profile',
        },
        {
          id: 'school-profile-2',
          namaSekolah: 'SDN 02',
          sppgId: null,
        },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockSppgUser);
      mockPrismaService.schoolProfile.findMany.mockResolvedValue(mockSchools);

      await expect(service.assignSchoolsToSppg(sppgId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.assignSchoolsToSppg(sppgId, dto)).rejects.toThrow(
        /sudah ditugaskan ke SPPG lain/,
      );
    });

    it('should allow reassigning schools to the same SPPG', async () => {
      const sppgId = 'sppg-user-1';
      const dto: AssignSchoolsDto = {
        school_ids: ['school-1'],
      };

      const mockSppgUser = {
        id: sppgId,
        email: 'sppg@test.com',
        role: 'sppg',
        sppgProfile: {
          id: 'sppg-profile-1',
          namaInstansi: 'SPPG Jakarta',
        },
      };

      const mockSchools = [
        {
          id: 'school-profile-1',
          namaSekolah: 'SDN 01',
          sppgId: 'sppg-profile-1', // Already assigned to same SPPG
        },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockSppgUser);
      mockPrismaService.schoolProfile.findMany.mockResolvedValue(mockSchools);
      mockPrismaService.schoolProfile.updateMany.mockResolvedValue({
        count: 1,
      });

      const result = await service.assignSchoolsToSppg(sppgId, dto);

      expect(result.message).toContain('1 sekolah berhasil ditugaskan');
    });

    it('should handle empty school_ids array', async () => {
      const sppgId = 'sppg-user-1';
      const dto: AssignSchoolsDto = {
        school_ids: [],
      };

      const mockSppgUser = {
        id: sppgId,
        email: 'sppg@test.com',
        role: 'sppg',
        sppgProfile: {
          id: 'sppg-profile-1',
          namaInstansi: 'SPPG Jakarta',
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockSppgUser);
      mockPrismaService.schoolProfile.findMany.mockResolvedValue([]);
      mockPrismaService.schoolProfile.updateMany.mockResolvedValue({
        count: 0,
      });

      const result = await service.assignSchoolsToSppg(sppgId, dto);

      expect(result.message).toContain('0 sekolah berhasil ditugaskan');
    });
  });

  describe('unassignSchoolsFromSppg', () => {
    it('should successfully unassign school from SPPG', async () => {
      const schoolId = 'school-user-1';
      const mockSchool = {
        id: 'school-profile-1',
        userId: schoolId,
        namaSekolah: 'SDN 01 Jakarta',
        sppgId: 'sppg-profile-1',
      };

      mockPrismaService.schoolProfile.findUnique.mockResolvedValue(mockSchool);
      mockPrismaService.schoolProfile.update.mockResolvedValue({
        ...mockSchool,
        sppgId: null,
      });

      const result = await service.unassignSchoolsFromSppg(schoolId);

      expect(result.message).toContain('SDN 01 Jakarta');
      expect(result.message).toContain('berhasil dihapus dari penugasan SPPG');
      expect(result.school.nama_sekolah).toBe('SDN 01 Jakarta');
      expect(mockPrismaService.schoolProfile.update).toHaveBeenCalledWith({
        where: { userId: schoolId },
        data: { sppgId: null },
      });
    });

    it('should throw NotFoundException if school not found', async () => {
      mockPrismaService.schoolProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.unassignSchoolsFromSppg('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.unassignSchoolsFromSppg('non-existent-id'),
      ).rejects.toThrow('Sekolah tidak ditemukan');
    });

    it('should throw BadRequestException if school not assigned to any SPPG', async () => {
      const schoolId = 'school-user-1';
      const mockSchool = {
        id: 'school-profile-1',
        userId: schoolId,
        namaSekolah: 'SDN 01 Jakarta',
        sppgId: null,
      };

      mockPrismaService.schoolProfile.findUnique.mockResolvedValue(mockSchool);

      await expect(
        service.unassignSchoolsFromSppg(schoolId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.unassignSchoolsFromSppg(schoolId),
      ).rejects.toThrow('Sekolah belum ditugaskan ke SPPG manapun');
      expect(mockPrismaService.schoolProfile.update).not.toHaveBeenCalled();
    });
  });
});
