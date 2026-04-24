import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Consignment } from '../consignments/entities/consignment.entity';
import { Expense } from '../expenses/entities/expense.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Consignment)
    private consignmentRepository: Repository<Consignment>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async generateConsignmentReport(startDate: Date, endDate: Date) {
    const consignments = await this.consignmentRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        isActive: true,
      },
      relations: ['sender', 'receiver'],
    });

    return {
      period: { startDate, endDate },
      totalConsignments: consignments.length,
      consignments,
    };
  }

  async generateExpenseReport(startDate: Date, endDate: Date) {
    const expenses = await this.expenseRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        isActive: true,
      },
      relations: ['branch'],
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      period: { startDate, endDate },
      totalExpenses,
      totalCount: expenses.length,
      expenses,
    };
  }

  async generateProfitLossReport(startDate: Date, endDate: Date) {
    const revenueResult = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .select('SUM(consignment.paidAmount)', 'total')
      .where('consignment.isActive = :isActive', { isActive: true })
      .getRawOne();

    const expenseResult = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total')
      .where('expense.isActive = :isActive', { isActive: true })
      .getRawOne();

    const revenue = Number(revenueResult?.total) || 0;
    const expenses = Number(expenseResult?.total) || 0;

    return {
      period: { startDate, endDate },
      revenue,
      expenses,
      profit: revenue - expenses,
      margin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
    };
  }
}