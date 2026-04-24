import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Consignment } from '../consignments/entities/consignment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { ConsignmentStatus, PaymentStatus, ManifestStatus } from '../../common/enums/status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Consignment)
    private consignmentRepository: Repository<Consignment>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async generateConsignmentReport(startDate: Date, endDate: Date) {
    const consignments = await this.consignmentRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        isActive: true,
      },
      relations: ['customer', 'senderBranch', 'receiverBranch', 'itemType'],
    });

    return {
      period: { startDate, endDate },
      totalConsignments: consignments.length,
      byStatus: this.groupByStatus(consignments),
      consignments,
    };
  }

  async generateRevenueReport(startDate: Date, endDate: Date) {
    const payments = await this.paymentRepository.find({
      where: {
        paymentDate: Between(startDate, endDate),
        status: PaymentStatus.PAID,
        isActive: true,
      },
      relations: ['consignment'],
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.paidAmount), 0);

    return {
      period: { startDate, endDate },
      totalRevenue,
      totalPayments: payments.length,
      payments,
    };
  }

  async generateExpenseReport(startDate: Date, endDate: Date) {
    const expenses = await this.expenseRepository.find({
      where: {
        expenseDate: Between(startDate, endDate),
        isActive: true,
      },
      relations: ['vehicle', 'manifest'],
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      period: { startDate, endDate },
      totalExpenses,
      totalCount: expenses.length,
      byCategory: this.groupByCategory(expenses),
      expenses,
    };
  }

  async generateProfitLossReport(startDate: Date, endDate: Date) {
    const revenueResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.paidAmount)', 'total')
      .where('payment.paymentDate BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('payment.status = :status', { status: PaymentStatus.PAID })
      .getRawOne();

    const expenseResult = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total')
      .where('expense.expenseDate BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('expense.isActive = :isActive', { isActive: true })
      .getRawOne();

    const revenue = revenueResult?.total || 0;
    const expenses = expenseResult?.total || 0;

    return {
      period: { startDate, endDate },
      revenue,
      expenses,
      profit: revenue - expenses,
      margin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
    };
  }

  private groupByStatus(consignments: Consignment[]) {
    const grouped = consignments.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return grouped;
  }

  private groupByCategory(expenses: Expense[]) {
    const grouped = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);
    return grouped;
  }
}