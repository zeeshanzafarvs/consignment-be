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

  private getAccountingBranchId(req: any, requestedBranchId?: string): string | undefined {
    if (req.user.role === UserRole.ADMIN) {
      return requestedBranchId;
    }

    return req.user.branchId || '__NO_BRANCH_ASSIGNED__';
  }

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
    @Query('period') period?: 'day' | 'week' | 'month' | 'all',
    @Query('branchId') branchId?: string,
  ) {
    const stats = await this.dashboardService.getAdminStats(period || 'all', branchId);
    return ApiResponseHelper.success(stats);
  }

   @Get('manager-stats')
   @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
   @ApiOperation({ summary: 'Get manager dashboard stats (branch specific)' })
   @ApiResponse({ status: 200, description: 'Manager stats retrieved successfully' })
   @ApiQuery({ name: 'branchId', required: false })
   @ApiQuery({ name: 'period', required: false })
   async getManagerStats(
     @Request() req: any,
     @Query('branchId') branchId?: string,
     @Query('period') period?: 'day' | 'week' | 'month' | 'all',
   ) {
     const stats = await this.dashboardService.getManagerStats(branchId || req.user.branchId, period || 'all');
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
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'period', required: false })
  async getBranchPerformance(
    @Query('branchId') branchId?: string,
    @Query('period') period?: 'day' | 'week' | 'month' | 'all',
  ) {
    const performance = await this.dashboardService.getBranchPerformance(branchId, period || 'all');
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
  @ApiQuery({ name: 'branchId', required: false })
  async getRevenueChart(@Query('period') period?: 'day' | 'week' | 'month' | 'all', @Query('branchId') branchId?: string) {
    const data = await this.dashboardService.getRevenueChart(period || 'all', branchId);
    return ApiResponseHelper.success(data);
  }

  // ===== ACCOUNTING DASHBOARD ENDPOINTS =====

  @Get('accounting/metrics')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get accounting dashboard overview metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  async getAccountingMetrics(
    @Request() req: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    const effectiveBranchId = this.getAccountingBranchId(req, branchId);
    const metrics = await this.dashboardService.getAccountingDashboardMetrics(
      dateFrom,
      dateTo,
      effectiveBranchId,
      paymentStatus,
    );
    return ApiResponseHelper.success(metrics);
  }

  @Get('accounting/revenue-details')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get detailed revenue management data' })
  @ApiResponse({ status: 200, description: 'Revenue details retrieved successfully' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'paymentStatus', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getRevenueDetails(
    @Request() req: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const effectiveBranchId = this.getAccountingBranchId(req, branchId);
    const details = await this.dashboardService.getRevenueDetails(
      dateFrom,
      dateTo,
      effectiveBranchId,
      paymentStatus,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
    return ApiResponseHelper.success(details);
  }

  @Get('accounting/payment-tracking')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get payment tracking data' })
  @ApiResponse({ status: 200, description: 'Payment tracking retrieved successfully' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'paymentType', required: false })
  @ApiQuery({ name: 'paymentMethod', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPaymentTracking(
    @Request() req: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
    @Query('paymentType') paymentType?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const effectiveBranchId = this.getAccountingBranchId(req, branchId);
    const tracking = await this.dashboardService.getPaymentTracking(
      dateFrom,
      dateTo,
      effectiveBranchId,
      paymentType,
      paymentMethod,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
    return ApiResponseHelper.success(tracking);
  }

  @Get('accounting/profit-loss')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get profit and loss data' })
  @ApiResponse({ status: 200, description: 'Profit and loss data retrieved successfully' })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  async getProfitAndLoss(
    @Request() req: any,
    @Query('period') period?: 'daily' | 'monthly' | 'custom',
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
  ) {
    const effectiveBranchId = this.getAccountingBranchId(req, branchId);
    const data = await this.dashboardService.getProfitAndLoss(
      period || 'daily',
      dateFrom,
      dateTo,
      effectiveBranchId,
    );
    return ApiResponseHelper.success(data);
  }

  @Get('accounting/cash-flow')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get cash flow management data' })
  @ApiResponse({ status: 200, description: 'Cash flow data retrieved successfully' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  async getCashFlow(
    @Request() req: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
  ) {
    const effectiveBranchId = this.getAccountingBranchId(req, branchId);
    const data = await this.dashboardService.getCashFlow(dateFrom, dateTo, effectiveBranchId);
    return ApiResponseHelper.success(data);
  }

  @Get('accounting/cash-flow-summary')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get cash flow summary totals' })
  @ApiResponse({ status: 200, description: 'Cash flow summary retrieved successfully' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  async getCashFlowSummary(
    @Request() req: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
  ) {
    const effectiveBranchId = this.getAccountingBranchId(req, branchId);
    const summary = await this.dashboardService.getCashFlowSummary(dateFrom, dateTo, effectiveBranchId);
    return ApiResponseHelper.success(summary);
  }

  @Get('accounting/revenue-expenses-chart')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get revenue vs expenses chart data split by date' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  async getRevenueExpensesChart(
    @Request() req: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
  ) {
    const effectiveBranchId = this.getAccountingBranchId(req, branchId);
    const data = await this.dashboardService.getRevenueExpensesChart(
      dateFrom,
      dateTo,
      effectiveBranchId,
    );
    return ApiResponseHelper.success(data);
  }

  @Get('accounting/payment-type-chart')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get payment type amounts chart data split by date' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'paymentType', required: false })
  @ApiQuery({ name: 'paymentMethod', required: false })
  async getPaymentTypeChart(
    @Request() req: any,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('branchId') branchId?: string,
    @Query('paymentType') paymentType?: string,
    @Query('paymentMethod') paymentMethod?: string,
  ) {
    const effectiveBranchId = this.getAccountingBranchId(req, branchId);
    const data = await this.dashboardService.getPaymentTypeChart(
      dateFrom,
      dateTo,
      effectiveBranchId,
      paymentType,
      paymentMethod,
    );
    return ApiResponseHelper.success(data);
  }
}