import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Admin - User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
  
}
