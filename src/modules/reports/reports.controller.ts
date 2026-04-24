import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

@ApiTags('Reports')
@Controller('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('daily-bookings')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Get daily booking register' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  async getDailyBookings(
    @Request() req: any,
    @Query('date') date: string,
    @Query('branchId') branchId?: string,
  ) {
    const report = await this.reportsService.getDailyBookings(date, branchId, req.user);
    return ApiResponseHelper.success(report);
  }

  @Get('manifest/:manifestId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Get vehicle loading list' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getManifestReport(@Param('manifestId') manifestId: string) {
    const report = await this.reportsService.getManifestReport(manifestId);
    return ApiResponseHelper.success(report);
  }

  @Get('delivery-receipt/:consignmentId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Get delivery receipt data' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getDeliveryReceipt(@Param('consignmentId') consignmentId: string) {
    const report = await this.reportsService.getDeliveryReceipt(consignmentId);
    return ApiResponseHelper.success(report);
  }

  @Get('customer-ledger/:customerId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SITE_OFFICER)
  @ApiOperation({ summary: 'Get customer ledger' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  async getCustomerLedger(@Request() req: any, @Param('customerId') customerId: string) {
    const report = await this.reportsService.getCustomerLedger(customerId, req.user);
    return ApiResponseHelper.success(report);
  }
}