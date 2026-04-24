import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Consignment } from '../consignments/entities/consignment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { ConsignmentStatus } from '../../common/enums/status.enum';

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
      bookedConsignments,
      inTransitConsignments,
      deliveredConsignments,
    ] = await Promise.all([
      this.consignmentRepository.count({ where: { isActive: true } }),
      this.consignmentRepository.count({ where: { status: ConsignmentStatus.BOOKED, isActive: true } }),
      this.consignmentRepository.count({ where: { status: ConsignmentStatus.IN_TRANSIT, isActive: true } }),
      this.consignmentRepository.count({ where: { status: ConsignmentStatus.DELIVERED, isActive: true } }),
    ]);

    const revenue = await this.getTotalRevenue();
    const expenses = await this.getTotalExpenses();

    return {
      totalConsignments,
      bookedConsignments,
      inTransitConsignments,
      deliveredConsignments,
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

  async getDailyStats(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [dailyConsignments, dailyDeliveries] = await Promise.all([
      this.consignmentRepository.count({
        where: {
          createdAt: Between(startOfDay, endOfDay),
          isActive: true,
        },
      }),
      this.consignmentRepository.count({
        where: {
          status: ConsignmentStatus.DELIVERED,
          deliveredAt: Between(startOfDay, endOfDay),
          isActive: true,
        },
      }),
    ]);

    return {
      date: date.toISOString().split('T')[0],
      consignments: dailyConsignments,
      deliveries: dailyDeliveries,
    };
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .select('SUM(consignment.paidAmount)', 'total')
      .where('consignment.isActive = :isActive', { isActive: true })
      .getRawOne();
    return Number(result?.total) || 0;
  }

  private async getTotalExpenses(): Promise<number> {
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total')
      .where('expense.isActive = :isActive', { isActive: true })
      .getRawOne();
    return Number(result?.total) || 0;
  }
}