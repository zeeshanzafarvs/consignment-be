import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ExpenseType } from '../../common/enums/status.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateExpenseDto {
  @IsString()
  branchId: string;

  @IsString()
  @IsOptional()
  manifestId?: string;

  @IsEnum(ExpenseType)
  type: ExpenseType;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;
}

class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  manifestId?: string;

  @IsEnum(ExpenseType)
  @IsOptional()
  type?: ExpenseType;

  @IsNumber()
  @IsOptional()
  @Min(1)
  amount?: number;

  @IsString()
  @IsOptional()
  note?: string;
}

@ApiTags('Expenses')
@Controller('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all expenses with filters' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'manifestId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
    @Query('manifestId') manifestId?: string,
    @Query('type') type?: ExpenseType,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const result = await this.expensesService.findAll(
      { branchId, manifestId, type, dateFrom, dateTo },
      { page: page ? parseInt(page) : 1, limit: limit ? parseInt(limit) : 10 },
    );
    return ApiResponseHelper.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const expense = await this.expensesService.findOne(id);
    return ApiResponseHelper.success(expense);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Create new expense' })
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateExpenseDto) {
    const expense = await this.expensesService.create(dto);
    return ApiResponseHelper.created(expense, 'Expense created successfully');
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update expense' })
  @ApiResponse({ status: 200, description: 'Expense updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    const expense = await this.expensesService.update(id, dto);
    return ApiResponseHelper.updated(expense, 'Expense updated successfully');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.expensesService.remove(id);
    return ApiResponseHelper.deleted('Expense deleted successfully');
  }
}