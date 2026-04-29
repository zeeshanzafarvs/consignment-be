import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateVehicleDto {
  @IsString()
  numberPlate: string;

  @IsString()
  @IsOptional()
  type?: string;
}

class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  numberPlate?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsOptional()
  isAvailable?: boolean;
}

@ApiTags('Vehicles')
@Controller('vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vehicles' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  async findAll() {
    const vehicles = await this.vehiclesService.findAll();
    return ApiResponseHelper.success(vehicles);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available vehicles' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  async findAvailable() {
    const vehicles = await this.vehiclesService.findAvailable();
    return ApiResponseHelper.success(vehicles);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Vehicle retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const vehicle = await this.vehiclesService.findOne(id);
    return ApiResponseHelper.success(vehicle);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateVehicleDto) {
    const vehicle = await this.vehiclesService.create(dto);
    return ApiResponseHelper.created(vehicle);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    const vehicle = await this.vehiclesService.update(id, dto);
    return ApiResponseHelper.updated(vehicle);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.vehiclesService.remove(id);
    return ApiResponseHelper.deleted();
  }
}