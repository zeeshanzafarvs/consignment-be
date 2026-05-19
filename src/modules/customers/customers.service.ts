import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { PaginationHelper, PaginatedResult } from '../../common/dtos/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async findAll(page = 1, limit = 10, search?: string): Promise<PaginatedResult<Customer>> {
    const queryBuilder = this.customerRepository.createQueryBuilder('customer')
      .where('customer.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(customer.name ILIKE :search OR customer.phone ILIKE :search OR customer.email ILIKE :search OR customer.cnic ILIKE :search)',
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
    const customer = await this.customerRepository.findOne({ where: { id, isActive: true } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async create(data: Partial<Customer>) {
    const customer = this.customerRepository.create(data);
    return this.customerRepository.save(customer);
  }

  async update(id: string, data: Partial<Customer>) {
    const customer = await this.findOne(id);
    Object.assign(customer, data);
    return this.customerRepository.save(customer);
  }

  async remove(id: string) {
    const customer = await this.findOne(id);
    customer.isActive = false;
    return this.customerRepository.save(customer);
  }
}