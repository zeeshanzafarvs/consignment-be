import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeederService } from './seeder.service';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private seederService: SeederService) {}

  @Post()
  @ApiOperation({ summary: 'Seed database with initial data' })
  @ApiResponse({ status: 201, description: 'Database seeded successfully' })
  async seed() {
    const result = await this.seederService.seed();
    return ApiResponseHelper.success(result, 'Database seeded successfully');
  }
}