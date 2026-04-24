import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async findAll() {
    return this.driverRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const driver = await this.driverRepository.findOne({ where: { id, isActive: true } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return driver;
  }

  async create(data: Partial<Driver>) {
    const driver = this.driverRepository.create(data);
    return this.driverRepository.save(driver);
  }

  async update(id: string, data: Partial<Driver>) {
    const driver = await this.findOne(id);
    Object.assign(driver, data);
    return this.driverRepository.save(driver);
  }

  async remove(id: string) {
    const driver = await this.findOne(id);
    driver.isActive = false;
    return this.driverRepository.save(driver);
  }
}