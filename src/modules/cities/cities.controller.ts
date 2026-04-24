import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
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
}

class UpdateCityDto {
  @IsString()
  @IsOptional()
  name?: string;
}

@ApiTags('Cities')
@Controller('cities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CitiesController {
  constructor(private citiesService: CitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cities with pagination and search' })
  @ApiResponse({ status: 200, description: 'Cities retrieved successfully' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.citiesService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
    });
    return ApiResponseHelper.success(result);
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
    return ApiResponseHelper.created(city, 'City created successfully');
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update city' })
  @ApiResponse({ status: 200, description: 'City updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    const city = await this.citiesService.update(id, dto);
    return ApiResponseHelper.updated(city, 'City updated successfully');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete city' })
  @ApiResponse({ status: 200, description: 'City deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.citiesService.remove(id);
    return ApiResponseHelper.deleted('City deleted successfully');
  }
}