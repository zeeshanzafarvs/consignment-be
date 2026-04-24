import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Consignment } from '../consignments/entities/consignment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { DispatchManifest } from '../dispatch-manifests/entities/dispatch-manifest.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Consignment, Payment, Expense, DispatchManifest])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}