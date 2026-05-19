import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { PaginationHelper, PaginatedResult } from '../../common/dtos/pagination.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async findAll(page = 1, limit = 10, search?: string): Promise<PaginatedResult<Driver>> {
    const queryBuilder = this.driverRepository.createQueryBuilder('driver')
      .where('driver.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(driver.name ILIKE :search OR driver.phone ILIKE :search OR driver.licenseNo ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [items, total] = await queryBuilder
      .skip(PaginationHelper.getSkip(page, limit))
      .take(limit)
      .getManyAndCount();

    return PaginationHelper.paginate(items, total, page, limit);
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