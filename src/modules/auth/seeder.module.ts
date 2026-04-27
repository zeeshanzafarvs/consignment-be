import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { SeedController } from './seed.controller';
import { User } from '../users/entities/user.entity';
import { City } from '../cities/entities/city.entity';
import { Branch } from '../branches/entities/branch.entity';
import { ItemType } from '../item-types/entities/item-type.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { RateList } from '../rate-lists/entities/rate-list.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Consignment } from '../consignments/entities/consignment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { DispatchManifest } from '../dispatch-manifests/entities/dispatch-manifest.entity';
import { ManifestItem } from '../dispatch-manifests/entities/manifest-item.entity';
import { Expense } from '../expenses/entities/expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, City, Branch, ItemType, Vehicle, Driver, RateList,
      Customer, Consignment, Payment, DispatchManifest, ManifestItem, Expense
    ]),
  ],
  controllers: [SeedController],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}