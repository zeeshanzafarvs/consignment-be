import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsEmail, MinLength } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from './entities/user.entity';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';

class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  branchId?: string;
}

class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  branchId?: string;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword: string;
}

class AssignBranchDto {
  @IsString()
  @IsOptional()
  branchId?: string | null;
}

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAll(@Query() query: PaginationQueryDto & { search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const result = await this.usersService.findAll(page, limit, query.search);
    return ApiResponseHelper.paginated(result.items, result.meta.total, result.meta.page, result.meta.limit);
  }

  @Get('branch/:branchId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get users for a specific branch' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findByBranch(@Param('branchId') branchId: string) {
    const users = await this.usersService.findAllForBranch(branchId);
    return ApiResponseHelper.success(users);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return ApiResponseHelper.success(user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: User) {
    const user = await this.usersService.create(dto, currentUser);
    return ApiResponseHelper.success(user, 'User created successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.update(id, dto, currentUser);
    return ApiResponseHelper.updated(user);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async deactivate(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const user = await this.usersService.deactivate(id, currentUser);
    return ApiResponseHelper.updated(user);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async activate(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const user = await this.usersService.activate(id, currentUser);
    return ApiResponseHelper.updated(user);
  }

  @Patch(':id/reset-password')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset user password (Admin only)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.resetPassword(id, dto.newPassword, currentUser);
    return ApiResponseHelper.updated(user);
  }

  @Patch(':id/assign-branch')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign branch to user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Branch assigned successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async assignBranch(
    @Param('id') id: string,
    @Body() dto: AssignBranchDto,
    @CurrentUser() currentUser: User,
  ) {
    const user = await this.usersService.assignBranch(id, dto.branchId, currentUser);
    return ApiResponseHelper.updated(user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    await this.usersService.remove(id, currentUser);
    return ApiResponseHelper.deleted();
  }
}