import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { PaymentStatus } from '../../common/enums/status.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreatePaymentDto {
  @IsString()
  consignmentId: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsString()
  @IsOptional()
  paymentMode?: string;

  @IsString()
  @IsOptional()
  transactionNo?: string;
}

class UpdatePaymentDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsNumber()
  @IsOptional()
  paidAmount?: number;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsString()
  @IsOptional()
  paymentMode?: string;

  @IsString()
  @IsOptional()
  transactionNo?: string;
}

@ApiTags('Payments')
@Controller('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async findAll() {
    const payments = await this.paymentsService.findAll();
    return ApiResponseHelper.success(payments);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const payment = await this.paymentsService.findOne(id);
    return ApiResponseHelper.success(payment);
  }

  @Get('consignment/:consignmentId')
  @ApiOperation({ summary: 'Get payments by consignment' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async findByConsignment(@Param('consignmentId') consignmentId: string) {
    const payments = await this.paymentsService.findByConsignment(consignmentId);
    return ApiResponseHelper.success(payments);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Create new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreatePaymentDto) {
    const payment = await this.paymentsService.create({
      ...dto,
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
    });
    return ApiResponseHelper.created(payment);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Update payment' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    const payment = await this.paymentsService.update(id, {
      ...dto,
      paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
    });
    return ApiResponseHelper.updated(payment);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully' })
  async updateStatus(@Param('id') id: string, @Body('status') status: PaymentStatus) {
    const payment = await this.paymentsService.updateStatus(id, status);
    return ApiResponseHelper.updated(payment);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete payment' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.paymentsService.remove(id);
    return ApiResponseHelper.deleted();
  }
}