import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SeederService } from './seeder.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

@ApiTags('Seed')
@Controller('seed')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SeedController {
  constructor(private seederService: SeederService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Seed database with initial data' })
  @ApiResponse({ status: 201, description: 'Database seeded successfully' })
  async seed() {
    const result = await this.seederService.seed();
    return ApiResponseHelper.success(result, 'Database seeded successfully');
  }
}