import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiResponse({ status: 200, description: 'Summary retrieved successfully' })
  async getSummary() {
    const summary = await this.dashboardService.getSummary();
    return ApiResponseHelper.success(summary);
  }

  @Get('consignments/stats')
  @ApiOperation({ summary: 'Get consignment statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  async getConsignmentStats() {
    const stats = await this.dashboardService.getConsignmentStats();
    return ApiResponseHelper.success(stats);
  }

  @Get('revenue/stats')
  @ApiOperation({ summary: 'Get revenue statistics' })
  @ApiResponse({ status: 200, description: 'Revenue stats retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getRevenueStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.dashboardService.getRevenueStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return ApiResponseHelper.success({ total: stats });
  }

  @Get('daily')
  @ApiOperation({ summary: 'Get daily statistics' })
  @ApiResponse({ status: 200, description: 'Daily stats retrieved successfully' })
  @ApiQuery({ name: 'date', required: false })
  async getDailyStats(@Query('date') date?: string) {
    const stats = await this.dashboardService.getDailyStats(date ? new Date(date) : new Date());
    return ApiResponseHelper.success(stats);
  }
}