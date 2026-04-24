import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { DispatchManifestsService } from './dispatch-manifests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ManifestStatus } from '../../common/enums/status.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateManifestDto {
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  driverId?: string;

  @IsString()
  @IsOptional()
  fromBranchId?: string;

  @IsString()
  @IsOptional()
  toBranchId?: string;
}

class UpdateManifestDto {
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  driverId?: string;

  @IsString()
  @IsOptional()
  fromBranchId?: string;

  @IsString()
  @IsOptional()
  toBranchId?: string;
}

@ApiTags('DispatchManifests')
@Controller('dispatch-manifests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DispatchManifestsController {
  constructor(private manifestsService: DispatchManifestsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all manifests' })
  @ApiResponse({ status: 200, description: 'Manifests retrieved successfully' })
  async findAll() {
    const manifests = await this.manifestsService.findAll();
    return ApiResponseHelper.success(manifests);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get manifest by ID' })
  @ApiResponse({ status: 200, description: 'Manifest retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const manifest = await this.manifestsService.findOne(id);
    return ApiResponseHelper.success(manifest);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get manifests by status' })
  @ApiResponse({ status: 200, description: 'Manifests retrieved successfully' })
  async findByStatus(@Param('status') status: ManifestStatus) {
    const manifests = await this.manifestsService.findByStatus(status);
    return ApiResponseHelper.success(manifests);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new manifest' })
  @ApiResponse({ status: 201, description: 'Manifest created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateManifestDto) {
    const manifest = await this.manifestsService.create(dto);
    return ApiResponseHelper.created(manifest);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update manifest' })
  @ApiResponse({ status: 200, description: 'Manifest updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateManifestDto) {
    const manifest = await this.manifestsService.update(id, dto);
    return ApiResponseHelper.updated(manifest);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update manifest status' })
  @ApiResponse({ status: 200, description: 'Manifest status updated successfully' })
  async updateStatus(@Param('id') id: string, @Body('status') status: ManifestStatus) {
    const manifest = await this.manifestsService.updateStatus(id, status);
    return ApiResponseHelper.updated(manifest);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete manifest' })
  @ApiResponse({ status: 200, description: 'Manifest deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.manifestsService.remove(id);
    return ApiResponseHelper.deleted();
  }
}