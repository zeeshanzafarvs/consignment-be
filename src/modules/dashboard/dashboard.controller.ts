import { Controller, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getStats(
    @Request() req: any,
    @Query('branchId') branchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const stats = await this.dashboardService.getStats(
      { branchId, dateFrom, dateTo },
      req.user,
    );
    return ApiResponseHelper.success(stats);
  }

  @Get('admin-stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard stats with charts data' })
  @ApiResponse({ status: 200, description: 'Admin stats retrieved successfully' })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  async getAdminStats(
    @Query('period') period?: 'day' | 'week' | 'month',
    @Query('branchId') branchId?: string,
  ) {
    const stats = await this.dashboardService.getAdminStats(period || 'day', branchId);
    return ApiResponseHelper.success(stats);
  }

   @Get('manager-stats')
   @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
   @ApiOperation({ summary: 'Get manager dashboard stats (branch specific)' })
   @ApiResponse({ status: 200, description: 'Manager stats retrieved successfully' })
   @ApiQuery({ name: 'branchId', required: false })
   async getManagerStats(
     @Request() req: any,
     @Query('branchId') branchId?: string,
   ) {
     const stats = await this.dashboardService.getManagerStats(branchId || req.user.branchId);
     return ApiResponseHelper.success(stats);
   }

   @Get('site-officer-stats')
   @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER, UserRole.BRANCH_MANAGER)
   @ApiOperation({ summary: 'Get site officer dashboard stats' })
   @ApiResponse({ status: 200, description: 'Site officer stats retrieved successfully' })
   async getSiteOfficerStats(@Request() req: any) {
     const stats = await this.dashboardService.getSiteOfficerStats(req.user.branchId);
     return ApiResponseHelper.success(stats);
   }

  @Get('recent-consignments')
  @ApiOperation({ summary: 'Get recent consignments' })
  @ApiResponse({ status: 200, description: 'Consignments retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getRecentConsignments(
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
  ) {
    const consignments = await this.dashboardService.getRecentConsignments(
      limit ? parseInt(limit) : 10,
      branchId,
      status,
    );
    return ApiResponseHelper.success(consignments);
  }

  @Get('recent-manifests')
  @ApiOperation({ summary: 'Get recent manifests' })
  @ApiResponse({ status: 200, description: 'Manifests retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentManifests(@Query('limit') limit?: string) {
    const manifests = await this.dashboardService.getRecentManifests(
      limit ? parseInt(limit) : 10,
    );
    return ApiResponseHelper.success(manifests);
  }

  @Get('branch-performance')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get branch performance data' })
  @ApiResponse({ status: 200, description: 'Branch performance retrieved successfully' })
  async getBranchPerformance() {
    const performance = await this.dashboardService.getBranchPerformance();
    return ApiResponseHelper.success(performance);
  }

  @Get('route-performance')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get route performance data' })
  @ApiResponse({ status: 200, description: 'Route performance retrieved successfully' })
  async getRoutePerformance() {
    const performance = await this.dashboardService.getRoutePerformance();
    return ApiResponseHelper.success(performance);
  }

  @Get('expense-breakdown')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get expense breakdown by category' })
  @ApiResponse({ status: 200, description: 'Expense breakdown retrieved successfully' })
  async getExpenseBreakdown() {
    const breakdown = await this.dashboardService.getExpenseBreakdown();
    return ApiResponseHelper.success(breakdown);
  }

  @Get('revenue-chart')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get revenue chart data' })
  @ApiResponse({ status: 200, description: 'Revenue chart data retrieved successfully' })
  @ApiQuery({ name: 'period', required: false })
  async getRevenueChart(@Query('period') period?: 'day' | 'week' | 'month') {
    const data = await this.dashboardService.getRevenueChart(period || 'day');
    return ApiResponseHelper.success(data);
  }
}