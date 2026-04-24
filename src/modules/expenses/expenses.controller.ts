import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ExpenseCategory } from '../../common/enums/status.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateExpenseDto {
  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsDateString()
  expenseDate: string;

  @IsString()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  manifestId?: string;
}

class UpdateExpenseDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsEnum(ExpenseCategory)
  @IsOptional()
  category?: ExpenseCategory;

  @IsDateString()
  @IsOptional()
  expenseDate?: string;

  @IsString()
  @IsOptional()
  vehicleId?: string;

  @IsString()
  @IsOptional()
  manifestId?: string;
}

@ApiTags('Expenses')
@Controller('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all expenses' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully' })
  async findAll() {
    const expenses = await this.expensesService.findAll();
    return ApiResponseHelper.success(expenses);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const expense = await this.expensesService.findOne(id);
    return ApiResponseHelper.success(expense);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get expenses by category' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully' })
  async findByCategory(@Param('category') category: ExpenseCategory) {
    const expenses = await this.expensesService.findByCategory(category);
    return ApiResponseHelper.success(expenses);
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Get expenses by vehicle' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully' })
  async findByVehicle(@Param('vehicleId') vehicleId: string) {
    const expenses = await this.expensesService.findByVehicle(vehicleId);
    return ApiResponseHelper.success(expenses);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Create new expense' })
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateExpenseDto) {
    const expense = await this.expensesService.create({
      ...dto,
      expenseDate: new Date(dto.expenseDate),
    });
    return ApiResponseHelper.created(expense);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Update expense' })
  @ApiResponse({ status: 200, description: 'Expense updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    const expense = await this.expensesService.update(id, {
      ...dto,
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
    });
    return ApiResponseHelper.updated(expense);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Delete expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.expensesService.remove(id);
    return ApiResponseHelper.deleted();
  }
}