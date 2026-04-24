import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consignment } from './entities/consignment.entity';
import { ConsignmentsService } from './consignments.service';
import { ConsignmentsController } from './consignments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Consignment])],
  controllers: [ConsignmentsController],
  providers: [ConsignmentsService],
  exports: [ConsignmentsService],
})
export class ConsignmentsModule {}