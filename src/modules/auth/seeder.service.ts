import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { City } from '../cities/entities/city.entity';
import { Branch } from '../branches/entities/branch.entity';
import { ItemType } from '../item-types/entities/item-type.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { RateList } from '../rate-lists/entities/rate-list.entity';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const SEED_DATA = {
  admin: {
    name: 'System Admin',
    email: 'admin@transport.com',
    password: 'Admin@123',
    role: 'ADMIN',
  },
  cities: [
    { name: 'Lahore' },
    { name: 'Karachi' },
    { name: 'Rawalpindi' },
    { name: 'Multan' },
    { name: 'Sialkot' },
    { name: 'Gujranwala' },
  ],
  branches: [
    { name: 'Lahore Main', cityName: 'Lahore', address: 'Main Market, Lahore', phone: '042111111111' },
    { name: 'Karachi Main', cityName: 'Karachi', address: 'Cloth Market, Karachi', phone: '021111111111' },
    { name: 'Rawalpindi Main', cityName: 'Rawalpindi', address: 'City, Rawalpindi', phone: '051111111111' },
  ],
  itemTypes: [
    { name: 'Tyres' },
    { name: 'Cartons' },
    { name: 'Bags' },
    { name: 'Machinery' },
    { name: 'General Goods' },
  ],
  vehicles: [
    { numberPlate: 'LES-1234', type: 'Truck' },
    { numberPlate: 'LHR-5678', type: 'Pickup' },
  ],
  drivers: [
    { name: 'Ali Driver', phone: '03000000001' },
    { name: 'Ahmed Driver', phone: '03000000002' },
  ],
};

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  private cityMap: Map<string, City> = new Map();
  private branchMap: Map<string, Branch> = new Map();

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
  ) {}

  async seed() {
    this.logger.log('Starting seeding...');

    await this.seedAdmin();
    await this.seedCities();
    await this.seedBranches();
    await this.seedItemTypes();
    const vehicles = await this.seedVehicles();
    const drivers = await this.seedDrivers();
    await this.seedRateLists();

    this.logger.log('Seeding completed!');
    return {
      admin: 'Admin user created',
      cities: `${this.cityMap.size} cities`,
      branches: `${this.branchMap.size} branches`,
      vehicles: `${vehicles}`,
      drivers: `${drivers}`,
    };
  }

  private async seedAdmin() {
    const existing = await this.userRepository.findOne({ where: { email: SEED_DATA.admin.email } });
    if (existing) {
      this.logger.log('Admin user already exists, skipping...');
      return;
    }

    const hashedPassword = await bcrypt.hash(SEED_DATA.admin.password, SALT_ROUNDS);
    const admin = this.userRepository.create({
      name: SEED_DATA.admin.name,
      email: SEED_DATA.admin.email,
      password: hashedPassword,
      role: SEED_DATA.admin.role as any,
    });

    await this.userRepository.save(admin);
    this.logger.log(`Admin user created: ${admin.email}`);
  }

  private async seedCities() {
    for (const cityData of SEED_DATA.cities) {
      let city = await this.cityRepository.findOne({ where: { name: cityData.name } });
      if (!city) {
        city = this.cityRepository.create(cityData);
        await this.cityRepository.save(city);
        this.logger.log(`Created city: ${cityData.name}`);
      } else {
        this.logger.log(`City already exists: ${cityData.name}`);
      }
      this.cityMap.set(cityData.name, city);
    }
  }

  private async seedBranches() {
    for (const branchData of SEED_DATA.branches) {
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
        this.logger.log(`Created branch: ${branchData.name}`);
      } else {
        this.logger.log(`Branch already exists: ${branchData.name}`);
      }
      this.branchMap.set(branchData.name, branch);
    }
  }

  private async seedItemTypes() {
    for (const itemData of SEED_DATA.itemTypes) {
      const existing = await this.itemTypeRepository.findOne({ where: { name: itemData.name } });
      if (!existing) {
        const itemType = this.itemTypeRepository.create(itemData);
        await this.itemTypeRepository.save(itemType);
        this.logger.log(`Created item type: ${itemData.name}`);
      } else {
        this.logger.log(`Item type already exists: ${itemData.name}`);
      }
    }
  }

  private async seedVehicles(): Promise<number> {
    let count = 0;
    for (const vehicleData of SEED_DATA.vehicles) {
      const existing = await this.vehicleRepository.findOne({ where: { numberPlate: vehicleData.numberPlate } });
      if (!existing) {
        const vehicle = this.vehicleRepository.create(vehicleData);
        await this.vehicleRepository.save(vehicle);
        this.logger.log(`Created vehicle: ${vehicleData.numberPlate}`);
        count++;
      } else {
        this.logger.log(`Vehicle already exists: ${vehicleData.numberPlate}`);
      }
    }
    return count;
  }

  private async seedDrivers(): Promise<number> {
    let count = 0;
    for (const driverData of SEED_DATA.drivers) {
      const existing = await this.driverRepository.findOne({ where: { phone: driverData.phone } });
      if (!existing) {
        const driver = this.driverRepository.create(driverData);
        await this.driverRepository.save(driver);
        this.logger.log(`Created driver: ${driverData.name}`);
        count++;
      } else {
        this.logger.log(`Driver already exists: ${driverData.name}`);
      }
    }
    return count;
  }

  private async seedRateLists() {
    const lahore = this.cityMap.get('Lahore');
    const karachi = this.cityMap.get('Karachi');
    const rawalpindi = this.cityMap.get('Rawalpindi');

    const itemTypes = await this.itemTypeRepository.find();
    const tyres = itemTypes.find((i) => i.name === 'Tyres');
    const cartons = itemTypes.find((i) => i.name === 'Cartons');
    const generalGoods = itemTypes.find((i) => i.name === 'General Goods');

    const rateListsData = [
      {
        fromCity: lahore,
        toCity: karachi,
        itemType: tyres,
        rateType: 'PER_ITEM',
        rate: 100,
        defaultLoading: 100,
        defaultUnloading: 100,
        defaultLabor: 50,
        defaultWarehouse: 0,
      },
      {
        fromCity: lahore,
        toCity: rawalpindi,
        itemType: cartons,
        rateType: 'PER_ITEM',
        rate: 80,
        defaultLoading: 50,
        defaultUnloading: 50,
        defaultLabor: 50,
        defaultWarehouse: 0,
      },
      {
        fromCity: karachi,
        toCity: lahore,
        itemType: generalGoods,
        rateType: 'PER_KG',
        rate: 30,
        defaultLoading: 100,
        defaultUnloading: 100,
        defaultLabor: 100,
        defaultWarehouse: 0,
      },
    ];

    for (const data of rateListsData) {
      if (!data.fromCity || !data.toCity || !data.itemType) continue;

      const existing = await this.rateListRepository.findOne({
        where: {
          fromCityId: data.fromCity.id,
          toCityId: data.toCity.id,
          itemTypeId: data.itemType.id,
        },
      });

      if (!existing) {
        const rateList = this.rateListRepository.create({
          fromCityId: data.fromCity.id,
          toCityId: data.toCity.id,
          itemTypeId: data.itemType.id,
          rateType: data.rateType as any,
          rate: data.rate,
          defaultLoading: data.defaultLoading,
          defaultUnloading: data.defaultUnloading,
          defaultLabor: data.defaultLabor,
          defaultWarehouse: data.defaultWarehouse,
          active: true,
        });
        await this.rateListRepository.save(rateList);
        this.logger.log(`Created rate list: ${data.fromCity.name} -> ${data.toCity.name} (${data.itemType.name})`);
      } else {
        this.logger.log(`Rate list already exists: ${data.fromCity.name} -> ${data.toCity.name}`);
      }
    }
  }
}