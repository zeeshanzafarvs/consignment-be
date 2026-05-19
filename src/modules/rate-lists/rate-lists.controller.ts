import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsNotEmpty, Min } from 'class-validator';
import { RateListsService, CalculateFareDto, FareCalculation } from './rate-lists.service';
import { RateList } from './entities/rate-list.entity';
import { RateType } from '../../common/enums/status.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateRateListDto {
  @IsString()
  @IsNotEmpty()
  fromCityId: string;

  @IsString()
  @IsNotEmpty()
  toCityId: string;

  @IsString()
  @IsNotEmpty()
  itemTypeId: string;

  @IsString()
  @IsOptional()
  rateType?: RateType;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stTax?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  ttTax?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

class UpdateRateListDto {
  @IsString()
  @IsOptional()
  fromCityId?: string;

  @IsString()
  @IsOptional()
  toCityId?: string;

  @IsString()
  @IsOptional()
  itemTypeId?: string;

  @IsString()
  @IsOptional()
  rateType?: RateType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  rate?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stTax?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  ttTax?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

class CalculateFareQueryDto implements CalculateFareDto {
  @IsString()
  @IsNotEmpty()
  fromCityId: string;

  @IsString()
  @IsNotEmpty()
  toCityId: string;

  @IsString()
  @IsNotEmpty()
  itemTypeId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;
}

@ApiTags('RateLists')
@Controller('rate-lists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RateListsController {
  constructor(private rateListsService: RateListsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rate lists with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Rate lists retrieved successfully' })
  @ApiQuery({ name: 'fromCityId', required: false })
  @ApiQuery({ name: 'toCityId', required: false })
  @ApiQuery({ name: 'itemTypeId', required: false })
  @ApiQuery({ name: 'active', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('fromCityId') fromCityId?: string,
    @Query('toCityId') toCityId?: string,
    @Query('itemTypeId') itemTypeId?: string,
    @Query('active') active?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.rateListsService.findAll(
      {
        fromCityId,
        toCityId,
        itemTypeId,
        active: active === 'true' ? true : active === 'false' ? false : undefined,
        search,
      },
      {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
      },
    );
    return ApiResponseHelper.paginated(
      result.data,
      result.total,
      result.page,
      result.limit,
      'Rate lists retrieved successfully',
    );
  }

  @Get('calculate')
  @ApiOperation({ summary: 'Calculate fare for a route' })
  @ApiResponse({ status: 200, description: 'Fare calculated successfully' })
  @ApiQuery({ name: 'fromCityId', required: true })
  @ApiQuery({ name: 'toCityId', required: true })
  @ApiQuery({ name: 'itemTypeId', required: true })
  @ApiQuery({ name: 'quantity', required: true })
  @ApiQuery({ name: 'weight', required: false })
  async calculate(
    @Query('fromCityId') fromCityId: string,
    @Query('toCityId') toCityId: string,
    @Query('itemTypeId') itemTypeId: string,
    @Query('quantity', ParseIntPipe) quantity: number,
    @Query('weight') weight?: string,
  ) {
    const calculation = await this.rateListsService.calculate({
      fromCityId,
      toCityId,
      itemTypeId,
      quantity,
      weight: weight ? parseFloat(weight) : undefined,
    });
    return ApiResponseHelper.success(calculation, 'Fare calculated successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rate list by ID' })
  @ApiResponse({ status: 200, description: 'Rate list retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const rateList = await this.rateListsService.findOne(id);
    return ApiResponseHelper.success(rateList);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new rate list' })
  @ApiResponse({ status: 201, description: 'Rate list created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateRateListDto) {
    const rateList = await this.rateListsService.create(dto);
    return ApiResponseHelper.created(rateList, 'Rate list created successfully');
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update rate list' })
  @ApiResponse({ status: 200, description: 'Rate list updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateRateListDto) {
    const rateList = await this.rateListsService.update(id, dto);
    return ApiResponseHelper.updated(rateList, 'Rate list updated successfully');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete rate list (soft delete)' })
  @ApiResponse({ status: 200, description: 'Rate list deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.rateListsService.remove(id);
    return ApiResponseHelper.deleted('Rate list deleted successfully');
  }
}