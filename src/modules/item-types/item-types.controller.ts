import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { ItemTypesService } from './item-types.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { PaginationQueryDto } from '../../common/dtos/pagination.dto';

class CreateItemTypeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

class UpdateItemTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

@ApiTags('ItemTypes')
@Controller('item-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemTypesController {
  constructor(private itemTypesService: ItemTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all item types' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Item types retrieved successfully' })
  async findAll(@Query() query: PaginationQueryDto & { search?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const result = await this.itemTypesService.findAll(page, limit, query.search);
    return ApiResponseHelper.paginated(result.items, result.meta.total, result.meta.page, result.meta.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get item type by ID' })
  @ApiResponse({ status: 200, description: 'Item type retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const itemType = await this.itemTypesService.findOne(id);
    return ApiResponseHelper.success(itemType);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new item type' })
  @ApiResponse({ status: 201, description: 'Item type created successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async create(@Body() dto: CreateItemTypeDto) {
    const itemType = await this.itemTypesService.create(dto);
    return ApiResponseHelper.created(itemType);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update item type' })
  @ApiResponse({ status: 200, description: 'Item type updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateItemTypeDto) {
    const itemType = await this.itemTypesService.update(id, dto);
    return ApiResponseHelper.updated(itemType);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete item type' })
  @ApiResponse({ status: 200, description: 'Item type deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.itemTypesService.remove(id);
    return ApiResponseHelper.deleted();
  }
}