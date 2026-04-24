import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async findAll() {
    return this.customerRepository.find({ where: { isActive: true } });
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