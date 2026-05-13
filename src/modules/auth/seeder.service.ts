import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
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
import { UserRole } from '../../common/enums/user-role.enum';
import { ConsignmentStatus, PaymentStatus, PaymentType, PaymentMethod, ManifestStatus, ExpenseType, CustomerType, RateType } from '../../common/enums/status.enum';
import { appendDailySequence, biltyNumberPrefix, manifestNumberPrefix } from '../../common/helpers/document-numbers.helper';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  private cityMap: Map<string, City> = new Map();
  private branchMap: Map<string, Branch> = new Map();
  private itemTypeMap: Map<string, ItemType> = new Map();
  private vehicleMap: Map<string, Vehicle> = new Map();
  private driverMap: Map<string, Driver> = new Map();
  private customerMap: Map<string, Customer> = new Map();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(City)
    private cityRepository: Repository<City>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(ItemType)
    private itemTypeRepository: Repository<ItemType>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(RateList)
    private rateListRepository: Repository<RateList>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Consignment)
    private consignmentRepository: Repository<Consignment>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(DispatchManifest)
    private manifestRepository: Repository<DispatchManifest>,
    @InjectRepository(ManifestItem)
    private manifestItemRepository: Repository<ManifestItem>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async seed() {
    this.logger.log('===========================================');
    this.logger.log('Starting comprehensive seeding...');
    this.logger.log('===========================================');

    const results: any = {};

    results.cities = await this.seedCities();
    results.branches = await this.seedBranches();
    results.itemTypes = await this.seedItemTypes();
    results.users = await this.seedUsers();
    results.vehicles = await this.seedVehicles();
    results.drivers = await this.seedDrivers();
    results.rateLists = await this.seedRateLists();
    results.customers = await this.seedCustomers();
    results.consignments = await this.seedConsignments();
    results.payments = await this.seedPayments();
    results.manifests = await this.seedDispatchManifests();
    results.expenses = await this.seedExpenses();

    this.logger.log('===========================================');
    this.logger.log('Seeding completed!');
    this.logger.log('===========================================');
    return results;
  }

  private async seedCities(): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;
    const cities = [
      { name: 'Lahore', existing: false },
      { name: 'Multan', existing: false },
      { name: 'Karachi', existing: true },
      { name: 'Rawalpindi', existing: true },
      { name: 'Faisalabad', existing: true },
      { name: 'Sialkot', existing: true },
    ];

    for (const cityData of cities) {
      let city = await this.cityRepository.findOne({ where: { name: cityData.name } });
      if (!city) {
        city = this.cityRepository.create({ name: cityData.name });
        await this.cityRepository.save(city);
        created++;
        this.logger.log(`  [CREATED] City: ${cityData.name}`);
      } else {
        skipped++;
        this.logger.log(`  [SKIPPED] City already exists: ${cityData.name}`);
      }
      this.cityMap.set(cityData.name, city);
    }
    return { created, skipped };
  }

  private async seedBranches(): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;
    const branches = [
      { name: 'Lahore Main Branch', cityName: 'Lahore', address: 'Main Market, Lahore', phone: '042111111111' },
      { name: 'Multan Main Branch', cityName: 'Multan', address: 'City Center, Multan', phone: '061111111111' },
      { name: 'Karachi Main Branch', cityName: 'Karachi', address: 'Cloth Market, Karachi', phone: '021222222222' },
      { name: 'Rawalpindi Main Branch', cityName: 'Rawalpindi', address: 'City Center, Rawalpindi', phone: '051333333333' },
    ];

    for (const branchData of branches) {
      let branch = await this.branchRepository.findOne({ where: { name: branchData.name } });
      if (!branch) {
        const city = this.cityMap.get(branchData.cityName);
        branch = this.branchRepository.create({
          name: branchData.name,
          cityId: city?.id,
          address: branchData.address,
          phone: branchData.phone,
        });
        await this.branchRepository.save(branch);
        created++;
        this.logger.log(`  [CREATED] Branch: ${branchData.name}`);
      } else {
        skipped++;
        this.logger.log(`  [SKIPPED] Branch already exists: ${branchData.name}`);
      }
      this.branchMap.set(branchData.name, branch);
    }
    return { created, skipped };
  }

  private async seedItemTypes(): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;
    const itemTypes = ['Tyres', 'Cartons', 'Bags', 'Electronics', 'General Goods'];

    for (const name of itemTypes) {
      const existing = await this.itemTypeRepository.findOne({ where: { name } });
      if (!existing) {
        const itemType = this.itemTypeRepository.create({ name });
        await this.itemTypeRepository.save(itemType);
        created++;
        this.logger.log(`  [CREATED] Item Type: ${name}`);
      } else {
        skipped++;
        this.logger.log(`  [SKIPPED] Item Type already exists: ${name}`);
      }
      this.itemTypeMap.set(name, existing || (await this.itemTypeRepository.findOne({ where: { name } }))!);
    }
    return { created, skipped };
  }

   private async seedUsers(): Promise<{ created: number; skipped: number }> {
     let created = 0, skipped = 0;
     const users = [
       { name: 'System Admin', email: 'admin@transport.com', password: 'Admin@123', role: UserRole.ADMIN },
       { name: 'Lahore Site Officer', email: 'officer.lahore@transport.com', password: 'Officer@123', role: UserRole.SITE_OFFICER, branchName: 'Lahore Main Branch' },
       { name: 'Multan Site Officer', email: 'officer.multan@transport.com', password: 'Officer@123', role: UserRole.SITE_OFFICER, branchName: 'Multan Main Branch' },
       { name: 'Lahore Branch Manager', email: 'manager.lahore@transport.com', password: 'Manager@123', role: UserRole.BRANCH_MANAGER, branchName: 'Lahore Main Branch' },
       { name: 'Multan Branch Manager', email: 'manager.multan@transport.com', password: 'Manager@123', role: UserRole.BRANCH_MANAGER, branchName: 'Multan Main Branch' },
     ];

    for (const userData of users) {
      const existing = await this.userRepository.findOne({ where: { email: userData.email } });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
        const branch = userData.branchName ? this.branchMap.get(userData.branchName) : null;
        const user = this.userRepository.create({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          branchId: branch?.id || null,
        });
        await this.userRepository.save(user);
        created++;
        this.logger.log(`  [CREATED] User: ${userData.email} (${userData.role})`);
      } else {
        skipped++;
        this.logger.log(`  [SKIPPED] User already exists: ${userData.email}`);
      }
    }
    return { created, skipped };
  }

  private async seedVehicles(): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;
    const vehicles = [
      { numberPlate: 'LEA-1234', type: 'Truck' },
      { numberPlate: 'LEA-5678', type: 'Pickup' },
      { numberPlate: 'MTA-1111', type: 'Truck' },
      { numberPlate: 'KHI-9090', type: 'Truck' },
    ];

    for (const vehicleData of vehicles) {
      const existing = await this.vehicleRepository.findOne({ where: { numberPlate: vehicleData.numberPlate } });
      if (!existing) {
        const vehicle = this.vehicleRepository.create(vehicleData);
        await this.vehicleRepository.save(vehicle);
        created++;
        this.logger.log(`  [CREATED] Vehicle: ${vehicleData.numberPlate}`);
      } else {
        skipped++;
        this.logger.log(`  [SKIPPED] Vehicle already exists: ${vehicleData.numberPlate}`);
      }
      this.vehicleMap.set(vehicleData.numberPlate, existing || (await this.vehicleRepository.findOne({ where: { numberPlate: vehicleData.numberPlate } }))!);
    }
    return { created, skipped };
  }

  private async seedDrivers(): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;
    const drivers = [
      { name: 'Ali Driver', phone: '03001111111' },
      { name: 'Ahmed Driver', phone: '03002222222' },
      { name: 'Bilal Driver', phone: '03003333333' },
    ];

    for (const driverData of drivers) {
      const existing = await this.driverRepository.findOne({ where: { phone: driverData.phone } });
      if (!existing) {
        const driver = this.driverRepository.create(driverData);
        await this.driverRepository.save(driver);
        created++;
        this.logger.log(`  [CREATED] Driver: ${driverData.name}`);
      } else {
        skipped++;
        this.logger.log(`  [SKIPPED] Driver already exists: ${driverData.name}`);
      }
      this.driverMap.set(driverData.name, existing || (await this.driverRepository.findOne({ where: { phone: driverData.phone } }))!);
    }
    return { created, skipped };
  }

  private async seedRateLists(): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;
    const rateLists = [
      { fromCity: 'Lahore', toCity: 'Multan', itemType: 'Tyres', rateType: RateType.PER_ITEM, rate: 100 },
      { fromCity: 'Lahore', toCity: 'Karachi', itemType: 'Cartons', rateType: RateType.PER_ITEM, rate: 80 },
      { fromCity: 'Multan', toCity: 'Lahore', itemType: 'Bags', rateType: RateType.PER_ITEM, rate: 70 },
      { fromCity: 'Lahore', toCity: 'Rawalpindi', itemType: 'Electronics', rateType: RateType.PER_KG, rate: 25 },
    ];

    for (const rateData of rateLists) {
      const fromCity = this.cityMap.get(rateData.fromCity);
      const toCity = this.cityMap.get(rateData.toCity);
      const itemType = this.itemTypeMap.get(rateData.itemType);

      if (!fromCity || !toCity || !itemType) {
        this.logger.log(`  [SKIPPED] Rate list missing references: ${rateData.fromCity} -> ${rateData.toCity}`);
        continue;
      }

      const existing = await this.rateListRepository.findOne({
        where: { fromCityId: fromCity.id, toCityId: toCity.id, itemTypeId: itemType.id },
      });

      if (!existing) {
        const rateList = this.rateListRepository.create({
          fromCityId: fromCity.id,
          toCityId: toCity.id,
          itemTypeId: itemType.id,
          rateType: rateData.rateType,
          rate: rateData.rate,
          active: true,
        });
        await this.rateListRepository.save(rateList);
        created++;
        this.logger.log(`  [CREATED] Rate: ${rateData.fromCity} -> ${rateData.toCity} (${rateData.itemType})`);
      } else {
        skipped++;
        this.logger.log(`  [SKIPPED] Rate already exists: ${rateData.fromCity} -> ${rateData.toCity} (${rateData.itemType})`);
      }
    }
    return { created, skipped };
  }

  private async seedCustomers(): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;
    const customers = [
      { name: 'Ali Traders', phone: '03011234567', cnic: '35201-1234567-1', cityName: 'Lahore', type: CustomerType.SENDER },
      { name: 'Bilal Enterprises', phone: '03021234567', cnic: '35202-1234567-2', cityName: 'Lahore', type: CustomerType.SENDER },
      { name: 'Hassan Goods', phone: '03031234567', cnic: '35203-1234567-3', cityName: 'Multan', type: CustomerType.SENDER },
      { name: 'Ahmed Cargo', phone: '03041234567', cnic: '35204-1234567-4', cityName: 'Faisalabad', type: CustomerType.SENDER },
      { name: 'Multan Traders', phone: '03051234567', cnic: '35205-1234567-5', cityName: 'Multan', type: CustomerType.RECEIVER },
      { name: 'Karachi Market', phone: '03061234567', cnic: '35206-1234567-6', cityName: 'Karachi', type: CustomerType.RECEIVER },
      { name: 'Rawalpindi Store', phone: '03071234567', cnic: '35207-1234567-7', cityName: 'Rawalpindi', type: CustomerType.RECEIVER },
      { name: 'Faisalabad Depot', phone: '03081234567', cnic: '35208-1234567-8', cityName: 'Faisalabad', type: CustomerType.RECEIVER },
      { name: 'Sialkot Electronics', phone: '03091234567', cnic: '35209-1234567-9', cityName: 'Sialkot', type: CustomerType.BOTH },
    ];

    for (const customerData of customers) {
      const existing = await this.customerRepository.findOne({ where: { phone: customerData.phone } });
      if (!existing) {
        const city = this.cityMap.get(customerData.cityName);
        const customer = this.customerRepository.create({
          name: customerData.name,
          phone: customerData.phone,
          cnic: customerData.cnic,
          cityId: city?.id,
          type: customerData.type,
        });
        await this.customerRepository.save(customer);
        created++;
        this.logger.log(`  [CREATED] Customer: ${customerData.name}`);
      } else {
        skipped++;
        this.logger.log(`  [SKIPPED] Customer already exists: ${customerData.name}`);
      }
      const customer = await this.customerRepository.findOne({ where: { phone: customerData.phone } });
      if (customer) this.customerMap.set(customerData.name, customer);
    }
    return { created, skipped };
  }

  private async seedConsignments(): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;

    // Clear existing consignments for clean seed
    await this.consignmentRepository.createQueryBuilder().delete().execute();
    await this.paymentRepository.createQueryBuilder().delete().execute();
    await this.manifestItemRepository.createQueryBuilder().delete().execute();
    await this.manifestRepository.createQueryBuilder().delete().execute();
    this.logger.log('  [CLEARED] Existing consignments, payments, and manifests');

    const consignments = [
      {
        biltyNumber: appendDailySequence(biltyNumberPrefix(), 1),
        senderName: 'Ali Traders',
        receiverName: 'Multan Traders',
        fromCity: 'Lahore', toCity: 'Multan',
        fromBranch: 'Lahore Main Branch', toBranch: 'Multan Main Branch',
        itemType: 'Tyres',
        quantity: 10, weight: 50,
        goodsDescription: 'Tyres for transport',
        status: ConsignmentStatus.BOOKED, paymentStatus: PaymentStatus.PARTIAL,
        fare: 1000, loading: 100, unloading: 100, labor: 50, totalAmount: 1250, paidAmount: 500,
        daysAgo: 0,
      },
      {
        biltyNumber: appendDailySequence(biltyNumberPrefix(), 2),
        senderName: 'Bilal Enterprises',
        receiverName: 'Karachi Market',
        fromCity: 'Lahore', toCity: 'Karachi',
        fromBranch: 'Lahore Main Branch', toBranch: 'Karachi Main Branch',
        itemType: 'Cartons',
        quantity: 20, weight: 100,
        goodsDescription: 'Clothing items in cartons',
        status: ConsignmentStatus.IN_TRANSIT, paymentStatus: PaymentStatus.PAID,
        fare: 1600, loading: 100, unloading: 100, labor: 50, totalAmount: 1850, paidAmount: 1850,
        daysAgo: 1,
      },
      {
        biltyNumber: appendDailySequence(biltyNumberPrefix(), 3),
        senderName: 'Hassan Goods',
        receiverName: 'Ali Traders',
        fromCity: 'Multan', toCity: 'Lahore',
        fromBranch: 'Multan Main Branch', toBranch: 'Lahore Main Branch',
        itemType: 'Bags',
        quantity: 15, weight: 75,
        goodsDescription: 'Rice bags',
        status: ConsignmentStatus.ARRIVED, paymentStatus: PaymentStatus.TO_PAY,
        fare: 1050, loading: 50, unloading: 50, labor: 20, totalAmount: 1170, paidAmount: 0,
        daysAgo: 2,
      },
    ];

    for (const c of consignments) {
      const sender = this.customerMap.get(c.senderName);
      const receiver = this.customerMap.get(c.receiverName);
      const fromCity = this.cityMap.get(c.fromCity);
      const toCity = this.cityMap.get(c.toCity);
      const fromBranch = this.branchMap.get(c.fromBranch);
      const toBranch = this.branchMap.get(c.toBranch);
      const itemType = this.itemTypeMap.get(c.itemType);

      if (!sender || !receiver || !fromCity || !toCity || !fromBranch || !toBranch) {
        this.logger.log(`  [SKIPPED] Consignment missing references: ${c.biltyNumber}`);
        continue;
      }

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - c.daysAgo);

      const consignment = this.consignmentRepository.create({
        biltyNumber: c.biltyNumber,
        senderId: sender.id,
        receiverId: receiver.id,
        fromCityId: fromCity.id,
        toCityId: toCity.id,
        fromBranchId: fromBranch.id,
        toBranchId: toBranch.id,
        itemTypeId: itemType?.id,
        status: c.status,
        paymentStatus: c.paymentStatus,
        quantity: c.quantity,
        weight: c.weight,
        goodsDescription: c.goodsDescription,
        fare: c.fare,
        loading: c.loading,
        unloading: c.unloading,
        labor: c.labor,
        totalAmount: c.totalAmount,
        paidAmount: c.paidAmount,
        remainingAmount: c.totalAmount - c.paidAmount,
        createdAt: createdAt,
      });
      await this.consignmentRepository.save(consignment);
      created++;
      this.logger.log(`  [CREATED] Consignment: ${c.biltyNumber} (${c.status})`);
    }
    return { created, skipped };
  }

  private async seedPayments(): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;

    const consignments = await this.consignmentRepository.find({
      where: { paymentStatus: PaymentStatus.PARTIAL },
    });

    for (const consignment of consignments) {
      const existing = await this.paymentRepository.findOne({
        where: { consignmentId: consignment.id },
      });
      if (!existing) {
        const payment = this.paymentRepository.create({
          consignmentId: consignment.id,
          amount: consignment.paidAmount,
          type: PaymentType.BOOKING,
          method: PaymentMethod.CASH,
        });
        await this.paymentRepository.save(payment);
        created++;
        this.logger.log(`  [CREATED] Booking Payment: Rs ${payment.amount} for ${consignment.biltyNumber}`);
      } else {
        skipped++;
      }
    }

    const paidConsignments = await this.consignmentRepository.find({
      where: { paymentStatus: PaymentStatus.PAID },
    });
    for (const consignment of paidConsignments) {
      const existing = await this.paymentRepository.findOne({
        where: { consignmentId: consignment.id },
      });
      if (!existing) {
        const payment = this.paymentRepository.create({
          consignmentId: consignment.id,
          amount: consignment.paidAmount,
          type: PaymentType.BOOKING,
          method: PaymentMethod.CASH,
        });
        await this.paymentRepository.save(payment);
        created++;
        this.logger.log(`  [CREATED] Full Payment: Rs ${payment.amount} for ${consignment.biltyNumber}`);
      } else {
        skipped++;
      }
    }
    return { created, skipped };
  }

  private async seedDispatchManifests(): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;

    const manifests = [
      {
        manifestNumber: appendDailySequence(manifestNumberPrefix(), 1),
        vehicleName: 'LEA-1234',
        driverName: 'Ali Driver',
        fromBranch: 'Lahore Main Branch',
        toBranch: 'Karachi Main Branch',
        status: ManifestStatus.DISPATCHED,
        consignmentSenderName: 'Bilal Enterprises',
        daysAgo: 1,
      },
      {
        manifestNumber: appendDailySequence(manifestNumberPrefix(), 2),
        vehicleName: 'MTA-1111',
        driverName: 'Ahmed Driver',
        fromBranch: 'Multan Main Branch',
        toBranch: 'Lahore Main Branch',
        status: ManifestStatus.ARRIVED,
        consignmentSenderName: 'Hassan Goods',
        daysAgo: 2,
      },
    ];

    for (const m of manifests) {
      const vehicle = this.vehicleMap.get(m.vehicleName);
      const driver = this.driverMap.get(m.driverName);
      const fromBranch = this.branchMap.get(m.fromBranch);
      const toBranch = this.branchMap.get(m.toBranch);

      if (!vehicle || !driver || !fromBranch || !toBranch) {
        this.logger.log(`  [SKIPPED] Manifest missing references: ${m.manifestNumber}`);
        continue;
      }

      // Find consignment by sender name
      const sender = this.customerMap.get(m.consignmentSenderName);
      const consignment = sender ? await this.consignmentRepository.findOne({
        where: { senderId: sender.id },
      }) : null;

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - m.daysAgo);

      const manifest = this.manifestRepository.create({
        manifestNumber: m.manifestNumber,
        vehicleId: vehicle.id,
        driverId: driver.id,
        fromBranchId: fromBranch.id,
        toBranchId: toBranch.id,
        status: m.status,
        departureTime: createdAt,
        createdAt: createdAt,
      });
      await this.manifestRepository.save(manifest);
      created++;
      this.logger.log(`  [CREATED] Manifest: ${m.manifestNumber} (${m.status})`);

      if (consignment) {
        const manifestItem = this.manifestItemRepository.create({
          manifestId: manifest.id,
          consignmentId: consignment.id,
        });
        await this.manifestItemRepository.save(manifestItem);
        this.logger.log(`  [LINKED] Consignment ${consignment.biltyNumber} to manifest ${manifest.manifestNumber}`);
      }
    }
    return { created, skipped };
  }

  private async seedExpenses(): Promise<{ created: number; skipped: number }> {
    let created = 0, skipped = 0;

    const lahoreBranch = this.branchMap.get('Lahore Main Branch');
    if (!lahoreBranch) {
      this.logger.log(`  [SKIPPED] No Lahore branch found for expenses`);
      return { created: 0, skipped: 0 };
    }

    const expenses = [
      { type: ExpenseType.LABOR, amount: 500, note: 'Loading labor charges', branch: lahoreBranch },
      { type: ExpenseType.FUEL, amount: 2000, note: 'Fuel for LEA-1234', branch: lahoreBranch },
      { type: ExpenseType.WAREHOUSE, amount: 800, note: 'Warehouse rent', branch: lahoreBranch },
    ];

    for (const expData of expenses) {
      const expense = this.expenseRepository.create({
        branchId: expData.branch.id,
        type: expData.type,
        amount: expData.amount,
        note: expData.note,
      });
      await this.expenseRepository.save(expense);
      created++;
      this.logger.log(`  [CREATED] Expense: ${expData.type} - Rs ${expData.amount}`);
    }
    return { created, skipped };
  }
}