import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AssignSchoolsDto } from './dto/assign-schools.dto';
import { AdminAssignService } from './admin-assign.service';

@ApiTags('Admin - User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService, private readonly adminAssignService: AdminAssignService) {}

  @Get('users')
  @ApiProperty({ description: 'Mengambil semua pengguna dengan filter dan paginasi' })
  @ApiResponse({ status: 200, description: 'Berhasil mengambil pengguna.' })
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    const result = await this.adminService.getAllUsers(query);
    return {
      success: true,
      message: 'Data users berhasil diambil',
      ...result,
    };
  }

  @Get('users/:user_id')
  @ApiOperation({
    summary: 'Get user detail',
    description: 'Get detailed information about a specific user',
  })
  @ApiParam({ name: 'user_id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetail(@Param('user_id') userId: string) {
    const data = await this.adminService.getUserDetail(userId);
    return {
      success: true,
      message: 'Data user berhasil diambil',
      data,
    };
  }


  @Patch('users/:user_id')
    @ApiOperation({
    summary: 'Update user status',
    description: 'Update user status (active/inactive) and send email notification',
  })
  @ApiParam({ name: 'user_id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserStatus(
    @Param('user_id') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ){
    const result = await this.adminService.updateUserStatus(userId, dto);
    return {
      success: true,
      ...result,
    };
  }

  @Delete('users/:user_id')
  @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'user_id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  async deleteUser(@Param('user_id') userId: string) {
    const result = await this.adminService.deleteUser(userId);
    return {
      success: true,
      ...result,
    };
  }

  @Post('sppg/:sppg_id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign schools to SPPG' })
  @ApiParam({ name: 'sppg_id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Schools assigned successfully' })
  async assignSchoolsToSppg(@Param('sppg_id') sppgId: string, @Body() dto: AssignSchoolsDto) {
    const result = await this.adminAssignService.assignSchoolsToSppg(sppgId, dto);
    return {
      success: true,
      ...result
    }
  }
  
  @Delete('schools/:school_id')
    @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unassign school from SPPG' })
  @ApiParam({ name: 'school_id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'School unassigned successfully' })
  async unassignSchoolsFromSppg(@Param('school_id' ) schoolId: string) {
    const result = await this.adminAssignService.unassignSchoolsFromSppg(schoolId);
    return {
      success: true,
      ...result
    }
  }

}
