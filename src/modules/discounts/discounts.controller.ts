import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { DiscountsService } from './discounts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { DiscountApplyTo } from '../../common/enums/status.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';

class CreateDiscountDto {
  @IsString()
  customerId: string;

  @IsNumber()
  @Min(0.01)
  @Max(20)
  discountPercentage: number;

  @IsEnum(DiscountApplyTo)
  applyTo: DiscountApplyTo;
}

class UpdateDiscountDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  @Max(20)
  discountPercentage?: number;

  @IsEnum(DiscountApplyTo)
  @IsOptional()
  applyTo?: DiscountApplyTo;
}

@ApiTags('Discounts')
@Controller('discounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiscountsController {
  constructor(private discountsService: DiscountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all discounts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Discounts retrieved successfully' })
  async findAll(@Query() query: PaginationQueryDto & { search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const result = await this.discountsService.findAll(page, limit, query.search);
    return ApiResponseHelper.paginated(result.items, result.meta.total, result.meta.page, result.meta.limit);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active approved discounts' })
  @ApiResponse({ status: 200, description: 'Active discounts retrieved successfully' })
  async findAllActive() {
    const discounts = await this.discountsService.findAllActive();
    return ApiResponseHelper.success(discounts);
  }

  @Get('by-customer/:customerId')
  @ApiOperation({ summary: 'Get approved discount by customer ID' })
  @ApiResponse({ status: 200, description: 'Discount retrieved successfully' })
  async findByCustomerId(@Param('customerId') customerId: string) {
    const discount = await this.discountsService.findApprovedByCustomerId(customerId);
    return ApiResponseHelper.success(discount);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discount by ID' })
  @ApiResponse({ status: 200, description: 'Discount retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const discount = await this.discountsService.findOne(id);
    return ApiResponseHelper.success(discount);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Create new discount' })
  @ApiResponse({ status: 201, description: 'Discount created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Request() req: any, @Body() dto: CreateDiscountDto) {
    const discount = await this.discountsService.createOrUpdate(dto, req.user?.id, req.user?.role);
    return ApiResponseHelper.created(discount, 'Discount created successfully');
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Update discount' })
  @ApiResponse({ status: 200, description: 'Discount updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    const discount = await this.discountsService.update(id, dto);
    return ApiResponseHelper.updated(discount, 'Discount updated successfully');
  }

  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve discount' })
  @ApiResponse({ status: 200, description: 'Discount approved successfully' })
  async approve(@Request() req: any, @Param('id') id: string) {
    const discount = await this.discountsService.approve(id, req.user?.id);
    return ApiResponseHelper.updated(discount, 'Discount approved successfully');
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject discount' })
  @ApiResponse({ status: 200, description: 'Discount rejected successfully' })
  async reject(@Request() req: any, @Param('id') id: string) {
    const discount = await this.discountsService.reject(id, req.user?.id);
    return ApiResponseHelper.updated(discount, 'Discount rejected successfully');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete discount (soft)' })
  @ApiResponse({ status: 200, description: 'Discount deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.discountsService.remove(id);
    return ApiResponseHelper.deleted('Discount deleted successfully');
  }
}
