import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsObject, ValidateNested, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ConsignmentsService } from './consignments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ConsignmentStatus, PaymentStatus } from '../../common/enums/status.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class SenderDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  cnic?: string;

  @IsString()
  @IsOptional()
  cityId?: string;
}

class ReceiverDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  cnic?: string;

  @IsString()
  @IsOptional()
  cityId?: string;
}

class ChargesDto {
  @IsNumber()
  @Min(0)
  fare: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  loading?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  unloading?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  labor?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  warehouse?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  misc?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stTax?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  ttTax?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  godown?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  handling?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  adjustment?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  previousBalance?: number;
}

class PaymentDto {
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsNumber()
  @IsOptional()
  @Min(0)
  paidAmount?: number;

  @IsString()
  @IsOptional()
  method?: string;
}

class CreateConsignmentDto {
  @IsObject()
  @ValidateNested()
  @Type(() => SenderDto)
  sender: SenderDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ReceiverDto)
  receiver: ReceiverDto;

  @IsString()
  fromBranchId: string;

  @IsString()
  toBranchId: string;

  @IsString()
  fromCityId: string;

  @IsString()
  toCityId: string;

  @IsString()
  itemTypeId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @IsString()
  goodsDescription: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ChargesDto)
  charges: ChargesDto;

  @IsObject()
  @ValidateNested()
  @Type(() => PaymentDto)
  @IsOptional()
  payment?: PaymentDto;
}

class UpdateChargesDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  fare?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  loading?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  unloading?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  labor?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  warehouse?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  misc?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stTax?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  ttTax?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  godown?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  handling?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  delivery?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  adjustment?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  previousBalance?: number;
}

class UpdatePaymentDto {
  @IsNumber()
  @Min(0)
  paidAmount: number;

  @IsString()
  @IsOptional()
  method?: string;
}

class UpdateConsignmentDto {
  @IsString()
  @IsOptional()
  goodsDescription?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @IsString()
  @IsOptional()
  fromCityId?: string;

  @IsString()
  @IsOptional()
  toCityId?: string;

  @IsString()
  @IsOptional()
  fromBranchId?: string;

  @IsString()
  @IsOptional()
  toBranchId?: string;

  @IsString()
  @IsOptional()
  itemTypeId?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => UpdateChargesDto)
  @IsOptional()
  charges?: UpdateChargesDto;

  @IsObject()
  @ValidateNested()
  @Type(() => UpdatePaymentDto)
  @IsOptional()
  payment?: UpdatePaymentDto;
}

class DeliverConsignmentDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  warehouse?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  labor?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  misc?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  paidAmount?: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  receiverName?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

@ApiTags('Consignments')
@Controller('consignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsignmentsController {
  constructor(private consignmentsService: ConsignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all consignments with filters' })
  @ApiResponse({ status: 200, description: 'Consignments retrieved successfully' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'biltyNumber', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  @ApiQuery({ name: 'fromCityId', required: false })
  @ApiQuery({ name: 'toCityId', required: false })
  @ApiQuery({ name: 'fromBranchId', required: false })
  @ApiQuery({ name: 'toBranchId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('biltyNumber') biltyNumber?: string,
    @Query('status') status?: ConsignmentStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('fromCityId') fromCityId?: string,
    @Query('toCityId') toCityId?: string,
    @Query('fromBranchId') fromBranchId?: string,
    @Query('toBranchId') toBranchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const result = await this.consignmentsService.findAll(
      {
        biltyNumber,
        status,
        paymentStatus,
        fromCityId,
        toCityId,
        fromBranchId,
        toBranchId,
        dateFrom,
        dateTo,
        search,
      },
      {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
      },
      req.user,
    );
    return ApiResponseHelper.paginated(
      result.data,
      result.total,
      result.page,
      result.limit,
      'Consignments retrieved successfully',
    );
  }

  @Get('by-bilty/:biltyNumber')
  @ApiOperation({ summary: 'Get consignment by bilty number' })
  @ApiResponse({ status: 200, description: 'Consignment retrieved successfully' })
  async findByBilty(@Param('biltyNumber') biltyNumber: string) {
    const consignment = await this.consignmentsService.findByBilty(biltyNumber);
    return ApiResponseHelper.success(consignment);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get consignment by ID' })
  @ApiResponse({ status: 200, description: 'Consignment retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const consignment = await this.consignmentsService.findOne(id);
    return ApiResponseHelper.success(consignment);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Create new consignment' })
  @ApiResponse({ status: 201, description: 'Consignment created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Request() req: any, @Body() dto: CreateConsignmentDto) {
    const consignment = await this.consignmentsService.create(dto, req.user?.id);
    return ApiResponseHelper.created(consignment, 'Consignment created successfully');
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Update consignment' })
  @ApiResponse({ status: 200, description: 'Consignment updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateConsignmentDto) {
    const consignment = await this.consignmentsService.update(id, dto);
    return ApiResponseHelper.updated(consignment, 'Consignment updated successfully');
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel consignment' })
  @ApiResponse({ status: 200, description: 'Consignment cancelled successfully' })
  async cancel(@Param('id') id: string) {
    const consignment = await this.consignmentsService.cancel(id);
    return ApiResponseHelper.updated(consignment, 'Consignment cancelled successfully');
  }

  @Post(':id/deliver')
  @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Deliver consignment' })
  @ApiResponse({ status: 200, description: 'Consignment delivered successfully' })
  async deliver(@Param('id') id: string, @Body() dto: DeliverConsignmentDto) {
    const consignment = await this.consignmentsService.deliver(id, dto);
    return ApiResponseHelper.updated(consignment, 'Consignment delivered successfully');
  }

  @Get('delivery/search')
  @ApiOperation({ summary: 'Search consignment for delivery' })
  @ApiResponse({ status: 200, description: 'Consignment retrieved successfully' })
  @ApiQuery({ name: 'biltyNumber', required: true })
  @ApiQuery({ name: 'receiverPhone', required: false })
  async searchForDelivery(
    @Query('biltyNumber') biltyNumber: string,
    @Query('receiverPhone') receiverPhone?: string,
  ) {
    const consignment = await this.consignmentsService.searchForDelivery(biltyNumber, receiverPhone);
    return ApiResponseHelper.success(consignment);
  }
}