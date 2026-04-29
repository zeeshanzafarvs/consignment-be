import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateDriverDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  /** Alias for clients that send `license` instead of `licenseNo`. */
  @IsString()
  @IsOptional()
  license?: string;

  @IsString()
  @IsOptional()
  licenseNo?: string;
}

class UpdateDriverDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  license?: string;

  @IsString()
  @IsOptional()
  licenseNo?: string;
}

function toDriverPayload(
  dto: CreateDriverDto | UpdateDriverDto,
): Partial<{ name: string; phone: string; licenseNo?: string }> {
  const { license, licenseNo, ...rest } = dto as CreateDriverDto & { license?: string };
  const resolvedLicense = licenseNo ?? license;
  return { ...rest, ...(resolvedLicense !== undefined ? { licenseNo: resolvedLicense } : {}) };
}

@ApiTags('Drivers')
@Controller('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private driversService: DriversService) {}

  @Get()
  @ApiOperation({ summary: 'Get all drivers' })
  @ApiResponse({ status: 200, description: 'Drivers retrieved successfully' })
  async findAll() {
    const drivers = await this.driversService.findAll();
    return ApiResponseHelper.success(drivers);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get driver by ID' })
  @ApiResponse({ status: 200, description: 'Driver retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const driver = await this.driversService.findOne(id);
    return ApiResponseHelper.success(driver);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new driver' })
  @ApiResponse({ status: 201, description: 'Driver created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateDriverDto) {
    const driver = await this.driversService.create(toDriverPayload(dto));
    return ApiResponseHelper.created(driver);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update driver' })
  @ApiResponse({ status: 200, description: 'Driver updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    const driver = await this.driversService.update(id, toDriverPayload(dto));
    return ApiResponseHelper.updated(driver);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete driver' })
  @ApiResponse({ status: 200, description: 'Driver deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.driversService.remove(id);
    return ApiResponseHelper.deleted();
  }
}