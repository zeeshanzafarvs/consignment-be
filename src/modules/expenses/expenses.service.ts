import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseCategory } from '../../common/enums/status.enum';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async findAll() {
    return this.expenseRepository.find({
      where: { isActive: true },
      relations: ['vehicle', 'manifest'],
    });
  }

  async findOne(id: string) {
    const expense = await this.expenseRepository.findOne({
      where: { id, isActive: true },
      relations: ['vehicle', 'manifest'],
    });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async findByCategory(category: ExpenseCategory) {
    return this.expenseRepository.find({
      where: { category, isActive: true },
      relations: ['vehicle', 'manifest'],
    });
  }

  async findByVehicle(vehicleId: string) {
    return this.expenseRepository.find({
      where: { vehicleId, isActive: true },
      relations: ['vehicle', 'manifest'],
    });
  }

  async create(data: Partial<Expense>) {
    const expense = this.expenseRepository.create(data);
    return this.expenseRepository.save(expense);
  }

  async update(id: string, data: Partial<Expense>) {
    const expense = await this.findOne(id);
    Object.assign(expense, data);
    return this.expenseRepository.save(expense);
  }

  async remove(id: string) {
    const expense = await this.findOne(id);
    expense.isActive = false;
    return this.expenseRepository.save(expense);
  }
}