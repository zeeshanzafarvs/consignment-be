import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateCustomerDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsOptional()
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
}

class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
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
}

@ApiTags('Customers')
@Controller('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async findAll() {
    const customers = await this.customersService.findAll();
    return ApiResponseHelper.success(customers);
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