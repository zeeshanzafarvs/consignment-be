import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { CitiesService } from './cities.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateCityDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  pincode?: string;
}

class UpdateCityDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  pincode?: string;
}

@ApiTags('Cities')
@Controller('cities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CitiesController {
  constructor(private citiesService: CitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cities' })
  @ApiResponse({ status: 200, description: 'Cities retrieved successfully' })
  async findAll() {
    const cities = await this.citiesService.findAll();
    return ApiResponseHelper.success(cities);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get city by ID' })
  @ApiResponse({ status: 200, description: 'City retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const city = await this.citiesService.findOne(id);
    return ApiResponseHelper.success(city);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new city' })
  @ApiResponse({ status: 201, description: 'City created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateCityDto) {
    const city = await this.citiesService.create(dto);
    return ApiResponseHelper.created(city);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update city' })
  @ApiResponse({ status: 200, description: 'City updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    const city = await this.citiesService.update(id, dto);
    return ApiResponseHelper.updated(city);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete city' })
  @ApiResponse({ status: 200, description: 'City deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.citiesService.remove(id);
    return ApiResponseHelper.deleted();
  }
}