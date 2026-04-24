import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { RateListsService } from './rate-lists.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateRateListDto {
  @IsString()
  name: string;

  @IsString()
  fromCityId: string;

  @IsString()
  toCityId: string;

  @IsNumber()
  rate: number;

  @IsString()
  @IsOptional()
  itemTypeId?: string;
}

class UpdateRateListDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  fromCityId?: string;

  @IsString()
  @IsOptional()
  toCityId?: string;

  @IsNumber()
  @IsOptional()
  rate?: number;

  @IsString()
  @IsOptional()
  itemTypeId?: string;
}

@ApiTags('RateLists')
@Controller('rate-lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RateListsController {
  constructor(private rateListsService: RateListsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rate lists' })
  @ApiResponse({ status: 200, description: 'Rate lists retrieved successfully' })
  async findAll() {
    const rateLists = await this.rateListsService.findAll();
    return ApiResponseHelper.success(rateLists);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rate list by ID' })
  @ApiResponse({ status: 200, description: 'Rate list retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const rateList = await this.rateListsService.findOne(id);
    return ApiResponseHelper.success(rateList);
  }

  @Get('route/check')
  @ApiOperation({ summary: 'Get rate by route' })
  @ApiResponse({ status: 200, description: 'Rate retrieved successfully' })
  async findByRoute(
    @Query('fromCityId') fromCityId: string,
    @Query('toCityId') toCityId: string,
    @Query('itemTypeId') itemTypeId?: string,
  ) {
    const rates = await this.rateListsService.findByRoute(fromCityId, toCityId, itemTypeId);
    return ApiResponseHelper.success(rates);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new rate list' })
  @ApiResponse({ status: 201, description: 'Rate list created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateRateListDto) {
    const rateList = await this.rateListsService.create(dto);
    return ApiResponseHelper.created(rateList);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update rate list' })
  @ApiResponse({ status: 200, description: 'Rate list updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateRateListDto) {
    const rateList = await this.rateListsService.update(id, dto);
    return ApiResponseHelper.updated(rateList);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete rate list' })
  @ApiResponse({ status: 200, description: 'Rate list deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.rateListsService.remove(id);
    return ApiResponseHelper.deleted();
  }
}