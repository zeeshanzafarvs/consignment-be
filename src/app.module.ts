import { Module } from '@nestjs/common';
import { ConfigModule, DatabaseModule } from './config';
import { AuthModule } from './modules/auth/auth.module';
import { SeederModule } from './modules/auth/seeder.module';
import { UsersModule } from './modules/users/users.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CitiesModule } from './modules/cities/cities.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ItemTypesModule } from './modules/item-types/item-types.module';
import { RateListsModule } from './modules/rate-lists/rate-lists.module';
import { ConsignmentsModule } from './modules/consignments/consignments.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { DispatchManifestsModule } from './modules/dispatch-manifests/dispatch-manifests.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DiscountsModule } from './modules/discounts/discounts.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    SeederModule,
    UsersModule,
    BranchesModule,
    CitiesModule,
    CustomersModule,
    ItemTypesModule,
    RateListsModule,
    ConsignmentsModule,
    VehiclesModule,
    DriversModule,
    DispatchManifestsModule,
    PaymentsModule,
    ExpensesModule,
    DashboardModule,
    ReportsModule,
    DiscountsModule,
  ],
})
export class AppModule {}