import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { DispatchManifestsService } from './dispatch-manifests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ManifestStatus } from '../../common/enums/status.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

class CreateManifestDto {
  @IsString()
  vehicleId: string;

  @IsString()
  driverId: string;

  @IsString()
  fromBranchId: string;

  @IsString()
  toBranchId: string;

  @IsString()
  @IsOptional()
  departureTime?: string;
}

class AddItemsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  consignmentIds: string[];
}

@ApiTags('DispatchManifests')
@Controller('dispatch-manifests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DispatchManifestsController {
  constructor(private manifestsService: DispatchManifestsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all manifests with filters' })
  @ApiResponse({ status: 200, description: 'Manifests retrieved successfully' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'driverId', required: false })
  @ApiQuery({ name: 'fromBranchId', required: false })
  @ApiQuery({ name: 'toBranchId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ManifestStatus,
    @Query('vehicleId') vehicleId?: string,
    @Query('driverId') driverId?: string,
    @Query('fromBranchId') fromBranchId?: string,
    @Query('toBranchId') toBranchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const result = await this.manifestsService.findAll(
      {
        status,
        vehicleId,
        driverId,
        fromBranchId,
        toBranchId,
        dateFrom,
        dateTo,
      },
      {
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
      },
    );
    return ApiResponseHelper.paginated(
      result.data,
      result.total,
      result.page,
      result.limit,
      'Manifests retrieved successfully',
    );
  }

  @Get('by-consignment/:consignmentId')
  @ApiOperation({ summary: 'Get manifest by consignment ID' })
  @ApiResponse({ status: 200, description: 'Manifest retrieved successfully' })
  async findByConsignmentId(@Param('consignmentId') consignmentId: string) {
    const manifest = await this.manifestsService.findByConsignmentId(consignmentId);
    if (!manifest) {
      return ApiResponseHelper.success(null);
    }
    return ApiResponseHelper.success(manifest);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get manifest by ID with items and totals' })
  @ApiResponse({ status: 200, description: 'Manifest retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const result = await this.manifestsService.findOneWithItems(id);
    return ApiResponseHelper.success(result);
  }

   @Post()
   @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER, UserRole.BRANCH_MANAGER)
   @ApiOperation({ summary: 'Create new manifest' })
   @ApiResponse({ status: 201, description: 'Manifest created successfully' })
   @ApiForbiddenResponse({ description: 'Forbidden' })
   async create(@Request() req: any, @Body() dto: CreateManifestDto) {
     const manifest = await this.manifestsService.create(dto, req.user?.id);
     return ApiResponseHelper.created(manifest, 'Manifest created successfully');
   }

   @Post(':id/items')
   @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER, UserRole.BRANCH_MANAGER)
   @ApiOperation({ summary: 'Add consignment items to manifest' })
   @ApiResponse({ status: 201, description: 'Items added successfully' })
   async addItems(@Param('id') id: string, @Body() dto: AddItemsDto) {
     const items = await this.manifestsService.addItems(id, dto);
     return ApiResponseHelper.created(items, 'Items added successfully');
   }

   @Delete(':id/items/:itemId')
   @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER, UserRole.BRANCH_MANAGER)
   @ApiOperation({ summary: 'Remove item from manifest' })
   @ApiResponse({ status: 200, description: 'Item removed successfully' })
   async removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
     await this.manifestsService.removeItem(id, itemId);
     return ApiResponseHelper.deleted('Item removed successfully');
   }

   @Patch(':id/dispatch')
   @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER, UserRole.BRANCH_MANAGER)
   @ApiOperation({ summary: 'Dispatch manifest' })
   @ApiResponse({ status: 200, description: 'Manifest dispatched successfully' })
   async dispatch(@Param('id') id: string) {
     const manifest = await this.manifestsService.dispatch(id);
     return ApiResponseHelper.updated(manifest, 'Manifest dispatched successfully');
   }

   @Patch(':id/arrive')
   @Roles(UserRole.ADMIN, UserRole.SITE_OFFICER, UserRole.BRANCH_MANAGER)
   @ApiOperation({ summary: 'Mark manifest as arrived' })
   @ApiResponse({ status: 200, description: 'Manifest arrived successfully' })
   async arrive(@Param('id') id: string) {
     const manifest = await this.manifestsService.arrive(id);
     return ApiResponseHelper.updated(manifest, 'Manifest arrived successfully');
   }

  @Patch(':id/close')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Close manifest' })
  @ApiResponse({ status: 200, description: 'Manifest closed successfully' })
  async close(@Param('id') id: string) {
    const manifest = await this.manifestsService.close(id);
    return ApiResponseHelper.updated(manifest, 'Manifest closed successfully');
  }
}