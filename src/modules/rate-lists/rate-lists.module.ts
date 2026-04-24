import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RateList } from './entities/rate-list.entity';
import { RateListsService } from './rate-lists.service';
import { RateListsController } from './rate-lists.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RateList])],
  controllers: [RateListsController],
  providers: [RateListsService],
  exports: [RateListsService],
})
export class RateListsModule {}