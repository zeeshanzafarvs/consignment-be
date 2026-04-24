import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseType } from '../../common/enums/status.enum';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async findAll() {
    return this.expenseRepository.find({
      where: { isActive: true },
      relations: ['branch', 'manifest'],
    });
  }

  async findOne(id: string) {
    const expense = await this.expenseRepository.findOne({
      where: { id, isActive: true },
      relations: ['branch', 'manifest'],
    });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async findByBranch(branchId: string) {
    return this.expenseRepository.find({
      where: { branchId, isActive: true },
      relations: ['branch', 'manifest'],
    });
  }

  async findByType(type: ExpenseType) {
    return this.expenseRepository.find({
      where: { type, isActive: true },
      relations: ['branch', 'manifest'],
    });
  }

  async findByCategory(category: ExpenseType) {
    return this.findByType(category);
  }

  async findByVehicle(vehicleId: string) {
    return this.expenseRepository.find({
      where: { isActive: true },
      relations: ['branch', 'manifest'],
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