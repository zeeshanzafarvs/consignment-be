import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { CustomerType } from '../../common/enums/status.enum';
import { PaginationQueryDto, PaginatedResult, PaginationHelper } from '../../common/dtos/pagination.dto';
import { Customer } from './entities/customer.entity';

class CreateCustomerDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  cityId?: string;

  @IsEnum(CustomerType)
  @IsOptional()
  type?: CustomerType;
}

class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  cityId?: string;

  @IsEnum(CustomerType)
  @IsOptional()
  type?: CustomerType;
}

@ApiTags('Customers')
@Controller('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async findAll(@Query() query: PaginationQueryDto & { search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const result = await this.customersService.findAll(page, limit, query.search);
    return ApiResponseHelper.paginated(result.items, result.meta.total, result.meta.page, result.meta.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const customer = await this.customersService.findOne(id);
    return ApiResponseHelper.success(customer);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Create new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateCustomerDto) {
    const customer = await this.customersService.create(dto);
    return ApiResponseHelper.created(customer);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    const customer = await this.customersService.update(id, dto);
    return ApiResponseHelper.updated(customer);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.customersService.remove(id);
    return ApiResponseHelper.deleted();
  }
}