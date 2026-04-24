import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Consignment } from '../consignments/entities/consignment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { ConsignmentStatus, PaymentStatus } from '../../common/enums/status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Consignment)
    private consignmentRepository: Repository<Consignment>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
  ) {}

  async getSummary() {
    const [
      totalConsignments,
      pendingConsignments,
      inTransitConsignments,
      deliveredConsignments,
      totalCustomers,
    ] = await Promise.all([
      this.consignmentRepository.count({ where: { isActive: true } }),
      this.consignmentRepository.count({ where: { status: ConsignmentStatus.PENDING, isActive: true } }),
      this.consignmentRepository.count({ where: { status: ConsignmentStatus.IN_TRANSIT, isActive: true } }),
      this.consignmentRepository.count({ where: { status: ConsignmentStatus.DELIVERED, isActive: true } }),
      this.getCustomerCount(),
    ]);

    const revenue = await this.getTotalRevenue();
    const expenses = await this.getTotalExpenses();

    return {
      totalConsignments,
      pendingConsignments,
      inTransitConsignments,
      deliveredConsignments,
      totalCustomers,
      revenue,
      expenses,
      profit: revenue - expenses,
    };
  }

  async getConsignmentStats() {
    const statusCounts = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .select('consignment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('consignment.isActive = :isActive', { isActive: true })
      .groupBy('consignment.status')
      .getRawMany();

    return statusCounts;
  }

  async getRevenueStats(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate || new Date();

    const payments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.PAID,
        isActive: true,
        paymentDate: Between(start, end),
      },
    });

    return payments.reduce((sum, p) => sum + Number(p.paidAmount), 0);
  }

  async getDailyStats(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      dailyConsignments,
      dailyDeliveries,
      dailyRevenue,
      dailyExpenses,
    ] = await Promise.all([
      this.consignmentRepository.count({
        where: {
          createdAt: Between(startOfDay, endOfDay),
          isActive: true,
        },
      }),
      this.consignmentRepository.count({
        where: {
          status: ConsignmentStatus.DELIVERED,
          updatedAt: Between(startOfDay, endOfDay),
          isActive: true,
        },
      }),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.paidAmount)', 'total')
        .where('payment.paymentDate BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
        .andWhere('payment.status = :status', { status: PaymentStatus.PAID })
        .getRawOne(),
      this.expenseRepository
        .createQueryBuilder('expense')
        .select('SUM(expense.amount)', 'total')
        .where('expense.expenseDate BETWEEN :start AND :end', { start: startOfDay, end: endOfDay })
        .andWhere('expense.isActive = :isActive', { isActive: true })
        .getRawOne(),
    ]);

    return {
      date: date.toISOString().split('T')[0],
      consignments: dailyConsignments,
      deliveries: dailyDeliveries,
      revenue: dailyRevenue?.total || 0,
      expenses: dailyExpenses?.total || 0,
    };
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.paidAmount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.PAID })
      .andWhere('payment.isActive = :isActive', { isActive: true })
      .getRawOne();
    return result?.total || 0;
  }

  private async getTotalExpenses(): Promise<number> {
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total')
      .where('expense.isActive = :isActive', { isActive: true })
      .getRawOne();
    return result?.total || 0;
  }

  private async getCustomerCount(): Promise<number> {
    return 0;
  }
}