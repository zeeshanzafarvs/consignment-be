import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
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

  @Get('recent-consignments')
  @ApiOperation({ summary: 'Get recent consignments' })
  @ApiResponse({ status: 200, description: 'Consignments retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentConsignments(@Query('limit') limit?: string) {
    const consignments = await this.dashboardService.getRecentConsignments(
      limit ? parseInt(limit) : 10,
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
}