import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { PaymentType, PaymentMethod } from '../../common/enums/status.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateManualPaymentDto {
  @IsString()
  consignmentId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

class CreatePaymentDto {
  @IsString()
  consignmentId: string;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsEnum(PaymentType)
  type: PaymentType;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

class UpdatePaymentDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  amount?: number;

  @IsEnum(PaymentType)
  @IsOptional()
  type?: PaymentType;

  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;
}

@ApiTags('Payments')
@Controller('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments with filters' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'consignmentId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'method', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('consignmentId') consignmentId?: string,
    @Query('type') type?: PaymentType,
    @Query('method') method?: PaymentMethod,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const result = await this.paymentsService.findAll(
      { consignmentId, type, method, dateFrom, dateTo },
      { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 10 },
    );
    return ApiResponseHelper.paginated(
      result.data,
      result.total,
      result.page,
      result.limit,
      'Payments retrieved successfully',
    );
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

  @Post('manual')
  @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Create manual payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async createManual(@Body() dto: CreateManualPaymentDto) {
    const payment = await this.paymentsService.createManual(dto);
    return ApiResponseHelper.created(payment, 'Payment created successfully');
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Create new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreatePaymentDto) {
    const payment = await this.paymentsService.create(dto);
    return ApiResponseHelper.created(payment, 'Payment created successfully');
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update payment' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    const payment = await this.paymentsService.update(id, dto);
    return ApiResponseHelper.updated(payment, 'Payment updated successfully');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete payment' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.paymentsService.remove(id);
    return ApiResponseHelper.deleted('Payment deleted successfully');
  }
}