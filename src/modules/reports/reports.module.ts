import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Consignment } from '../consignments/entities/consignment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Payment } from '../payments/entities/payment.entity';
import { DispatchManifest } from '../dispatch-manifests/entities/dispatch-manifest.entity';
import { ManifestItem } from '../dispatch-manifests/entities/manifest-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Consignment, Customer, Payment, DispatchManifest, ManifestItem])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}