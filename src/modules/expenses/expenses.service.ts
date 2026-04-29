import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { ExpenseType } from '../../common/enums/status.enum';

export interface ExpenseFilters {
  branchId?: string;
  manifestId?: string;
  type?: ExpenseType;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CreateExpenseDto {
  branchId: string;
  manifestId?: string;
  type: ExpenseType;
  amount: number;
  note?: string;
}

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async findAll(
    filters: ExpenseFilters,
    pagination: PaginationParams,
  ): Promise<{ data: Expense[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page, limit } = pagination;
    const { branchId, manifestId, type, dateFrom, dateTo } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.branch', 'branch')
      .leftJoinAndSelect('expense.manifest', 'manifest')
      .andWhere('expense.isActive = :isActive', { isActive: true });

    if (branchId) {
      queryBuilder.andWhere('expense.branchId = :branchId', { branchId });
    }
    if (manifestId) {
      queryBuilder.andWhere('expense.manifestId = :manifestId', { manifestId });
    }
    if (type) {
      queryBuilder.andWhere('expense.type = :type', { type });
    }
    if (dateFrom) {
      queryBuilder.andWhere('expense.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }
    if (dateTo) {
      queryBuilder.andWhere('expense.createdAt <= :dateTo', { dateTo: new Date(dateTo) });
    }

    queryBuilder.skip(skip).take(limit).orderBy('expense.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['branch', 'manifest'],
    });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async findByBranch(branchId: string): Promise<Expense[]> {
    return this.expenseRepository.find({
      where: { branchId, isActive: true },
      relations: ['branch', 'manifest'],
    });
  }

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expenseRepository.create(dto);
    return this.expenseRepository.save(expense);
  }

  async update(id: string, data: Partial<Expense>): Promise<Expense> {
    const expense = await this.findOne(id);
    Object.assign(expense, data);
    return this.expenseRepository.save(expense);
  }

  async remove(id: string): Promise<void> {
    const expense = await this.findOne(id);
    expense.isActive = false;
    await this.expenseRepository.save(expense);
  }
}