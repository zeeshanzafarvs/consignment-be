import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Consignment } from '../consignments/entities/consignment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { DispatchManifest } from '../dispatch-manifests/entities/dispatch-manifest.entity';
import { ConsignmentStatus, PaymentStatus } from '../../common/enums/status.enum';
import { User } from '../users/entities/user.entity';

export interface DashboardStats {
  todayBookings: number;
  todayRevenue: number;
  todayPaidAmount: number;
  todayRemainingAmount: number;
  pendingDeliveries: number;
  inTransitConsignments: number;
  deliveredToday: number;
  totalToPayAmount: number;
  totalExpenses: number;
  estimatedProfit: number;
}

export interface DashboardFilters {
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Consignment)
    private consignmentRepository: Repository<Consignment>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(DispatchManifest)
    private manifestRepository: Repository<DispatchManifest>,
  ) {}

  async getStats(filters: DashboardFilters, user?: User): Promise<DashboardStats> {
    const { branchId, dateFrom, dateTo } = filters;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startDate = dateFrom ? new Date(dateFrom) : today;
    const endDate = dateTo ? new Date(dateTo) : endOfToday;

    const consignmentQuery = this.consignmentRepository
      .createQueryBuilder('consignment')
      .where('consignment.isActive = :isActive', { isActive: true });

    if (branchId) {
      consignmentQuery.andWhere('consignment.fromBranchId = :branchId', { branchId });
    }

    if (user?.role === 'MANAGER' && user.branchId) {
      consignmentQuery.andWhere(
        '(consignment.fromBranchId = :branchId OR consignment.toBranchId = :branchId)',
        { branchId: user.branchId },
      );
    } else if (user?.role === 'SITE_OFFICER' && user.branchId) {
      consignmentQuery.andWhere(
        '(consignment.fromBranchId = :branchId OR consignment.toBranchId = :branchId)',
        { branchId: user.branchId },
      );
    }

    const [
      todayBookingsResult,
      revenueResult,
      paidAmountResult,
      remainingAmountResult,
      pendingDeliveriesResult,
      inTransitResult,
      deliveredTodayResult,
      toPayResult,
    ] = await Promise.all([
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', { start: startDate, end: endDate })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COALESCE(SUM(consignment.totalAmount), 0)', 'total')
        .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', { start: startDate, end: endDate })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COALESCE(SUM(consignment.paidAmount), 0)', 'total')
        .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', { start: startDate, end: endDate })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COALESCE(SUM(consignment.remainingAmount), 0)', 'total')
        .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', { start: startDate, end: endDate })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .where('consignment.status NOT IN (:...statuses)', {
          statuses: [ConsignmentStatus.DELIVERED, ConsignmentStatus.CANCELLED],
        })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .where('consignment.status = :status', { status: ConsignmentStatus.IN_TRANSIT })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .where('consignment.status = :status', { status: ConsignmentStatus.DELIVERED })
        .andWhere('consignment.deliveredAt >= :start AND consignment.deliveredAt <= :end', {
          start: startDate,
          end: endDate,
        })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COALESCE(SUM(consignment.remainingAmount), 0)', 'total')
        .where('consignment.paymentStatus = :status', { status: PaymentStatus.TO_PAY })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
    ]);

    const expenseQuery = this.expenseRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total')
      .where('expense.createdAt >= :start AND expense.createdAt <= :end', { start: startDate, end: endDate })
      .andWhere('expense.isActive = :isActive', { isActive: true });

    if (branchId) {
      expenseQuery.andWhere('expense.branchId = :branchId', { branchId });
    }

    const expensesResult = await expenseQuery.getRawOne();

    const todayRevenue = Number(revenueResult?.total) || 0;
    const todayPaidAmount = Number(paidAmountResult?.total) || 0;
    const totalExpenses = Number(expensesResult?.total) || 0;
    const estimatedProfit = todayPaidAmount - totalExpenses;

    return {
      todayBookings: parseInt(todayBookingsResult?.count || '0'),
      todayRevenue,
      todayPaidAmount,
      todayRemainingAmount: Number(remainingAmountResult?.total) || 0,
      pendingDeliveries: parseInt(pendingDeliveriesResult?.count || '0'),
      inTransitConsignments: parseInt(inTransitResult?.count || '0'),
      deliveredToday: parseInt(deliveredTodayResult?.count || '0'),
      totalToPayAmount: Number(toPayResult?.total) || 0,
      totalExpenses,
      estimatedProfit,
    };
  }

  async getRecentConsignments(limit = 10): Promise<Consignment[]> {
    return this.consignmentRepository.find({
      where: { isActive: true },
      relations: ['sender', 'receiver', 'fromCity', 'toCity'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentManifests(limit = 10): Promise<DispatchManifest[]> {
    return this.manifestRepository.find({
      where: { isActive: true },
      relations: ['vehicle', 'driver', 'fromBranch', 'toBranch'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}