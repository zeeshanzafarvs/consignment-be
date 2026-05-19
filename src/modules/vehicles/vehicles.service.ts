import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { PaginationHelper, PaginatedResult } from '../../common/dtos/pagination.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async findAll(page = 1, limit = 10, search?: string): Promise<PaginatedResult<Vehicle>> {
    const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle')
      .where('vehicle.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(vehicle.numberPlate ILIKE :search OR vehicle.type ILIKE :search)',
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
    const vehicle = await this.vehicleRepository.findOne({ where: { id, isActive: true } });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  async findAvailable() {
    return this.vehicleRepository.find({ where: { isActive: true, isAvailable: true } });
  }

  async create(data: Partial<Vehicle>) {
    const vehicle = this.vehicleRepository.create(data);
    return this.vehicleRepository.save(vehicle);
  }

  async update(id: string, data: Partial<Vehicle>) {
    const vehicle = await this.findOne(id);
    Object.assign(vehicle, data);
    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: string) {
    const vehicle = await this.findOne(id);
    vehicle.isActive = false;
    return this.vehicleRepository.save(vehicle);
  }
}