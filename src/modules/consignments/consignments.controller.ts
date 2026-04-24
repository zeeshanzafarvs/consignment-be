import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ConsignmentsService } from './consignments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ConsignmentStatus } from '../../common/enums/status.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateConsignmentDto {
  @IsString()
  customerId: string;

  @IsString()
  @IsOptional()
  senderBranchId?: string;

  @IsString()
  @IsOptional()
  receiverBranchId?: string;

  @IsString()
  @IsOptional()
  itemTypeId?: string;

  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  weight: number;

  @IsNumber()
  rate: number;

  @IsString()
  @IsOptional()
  recipientName?: string;

  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @IsString()
  @IsOptional()
  recipientAddress?: string;

  @IsString()
  @IsOptional()
  recipientCityId?: string;
}

class UpdateConsignmentDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  senderBranchId?: string;

  @IsString()
  @IsOptional()
  receiverBranchId?: string;

  @IsString()
  @IsOptional()
  itemTypeId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsNumber()
  @IsOptional()
  rate?: number;

  @IsString()
  @IsOptional()
  recipientName?: string;

  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @IsString()
  @IsOptional()
  recipientAddress?: string;

  @IsString()
  @IsOptional()
  recipientCityId?: string;
}

@ApiTags('Consignments')
@Controller('consignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsignmentsController {
  constructor(private consignmentsService: ConsignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all consignments' })
  @ApiResponse({ status: 200, description: 'Consignments retrieved successfully' })
  async findAll() {
    const consignments = await this.consignmentsService.findAll();
    return ApiResponseHelper.success(consignments);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get consignment by ID' })
  @ApiResponse({ status: 200, description: 'Consignment retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const consignment = await this.consignmentsService.findOne(id);
    return ApiResponseHelper.success(consignment);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get consignments by customer' })
  @ApiResponse({ status: 200, description: 'Consignments retrieved successfully' })
  async findByCustomer(@Param('customerId') customerId: string) {
    const consignments = await this.consignmentsService.findByCustomer(customerId);
    return ApiResponseHelper.success(consignments);
  }

  @Get('manifest/:manifestId')
  @ApiOperation({ summary: 'Get consignments by manifest' })
  @ApiResponse({ status: 200, description: 'Consignments retrieved successfully' })
  async findByManifest(@Param('manifestId') manifestId: string) {
    const consignments = await this.consignmentsService.findByManifest(manifestId);
    return ApiResponseHelper.success(consignments);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Create new consignment' })
  @ApiResponse({ status: 201, description: 'Consignment created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateConsignmentDto) {
    const totalAmount = dto.quantity * dto.rate;
    const consignment = await this.consignmentsService.create({
      ...dto,
      totalAmount,
    });
    return ApiResponseHelper.created(consignment);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Update consignment' })
  @ApiResponse({ status: 200, description: 'Consignment updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateConsignmentDto) {
    const consignment = await this.consignmentsService.update(id, dto);
    return ApiResponseHelper.updated(consignment);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Update consignment status' })
  @ApiResponse({ status: 200, description: 'Consignment status updated successfully' })
  async updateStatus(@Param('id') id: string, @Body('status') status: ConsignmentStatus) {
    const consignment = await this.consignmentsService.updateStatus(id, status);
    return ApiResponseHelper.updated(consignment);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete consignment' })
  @ApiResponse({ status: 200, description: 'Consignment deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.consignmentsService.remove(id);
    return ApiResponseHelper.deleted();
  }
}