import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between, In } from 'typeorm';
import { Consignment } from '../consignments/entities/consignment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { DispatchManifest } from '../dispatch-manifests/entities/dispatch-manifest.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { ConsignmentStatus, PaymentStatus } from '../../common/enums/status.enum';
import { User } from '../users/entities/user.entity';

// Dashboard only shows these statuses
const DASHBOARD_STATUSES = [
  ConsignmentStatus.IN_TRANSIT,
  ConsignmentStatus.ARRIVED,
  ConsignmentStatus.DELIVERED,
];

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

export interface AdminDashboardStats {
  summary: {
    todayRevenue: number;
    monthRevenue: number;
    totalProfit: number;
    totalConsignments: number;
    pendingDeliveries: number;
  };
  revenueChart: { date: string; revenue: number; profit: number }[];
  branchPerformance: { branchName: string; totalBookings: number; revenue: number; profit: number }[];
  routePerformance: { route: string; bookings: number; revenue: number }[];
  expenseBreakdown: { category: string; amount: number }[];
  recentConsignments: any[];
}

export interface ManagerDashboardStats {
  todayBookings: number;
  todayRevenue: number;
  /** Sum of expenses recorded today for this branch (incl. manifest-linked). */
  todayExpenses: number;
  /** todayRevenue − todayExpenses */
  estimatedProfit: number;
  pendingDeliveries: number;
  deliveredToday: number;
  dailyRevenue: { date: string; revenue: number }[];
  bookingsCount: { date: string; count: number }[];
  branchConsignments: any[];
  incomingParcels: any[];
  outgoingParcels: any[];
  warehouseItems: any[];
}

export interface SiteOfficerDashboardStats {
  todayBookings: number;
  pendingDeliveries: number;
  incomingParcels: number;
  pendingConsignments: any[];
  inTransitConsignments: any[];
  arrivedConsignments: any[];
  deliveredConsignments: any[];
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
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async getStats(filters: DashboardFilters, user?: User): Promise<DashboardStats> {
    const { branchId, dateFrom, dateTo } = filters;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startDate = dateFrom ? new Date(dateFrom) : today;
    const endDate = dateTo ? new Date(dateTo) : endOfToday;

    // Helper method to apply branch filter
    const applyBranchFilter = (query: any) => {
      if (branchId) {
        query.andWhere('consignment.fromBranchId = :branchId', { branchId });
      } else if (user?.role === 'SITE_OFFICER' && user.branchId) {
        query.andWhere(
          '(consignment.fromBranchId = :branchId OR consignment.toBranchId = :branchId)',
          { branchId: user.branchId },
        );
      }
    };

    const expenseQuery = this.expenseRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount), 0)', 'total')
      .where('expense.createdAt >= :start AND expense.createdAt <= :end', { start: startDate, end: endDate })
      .andWhere('expense.isActive = :isActive', { isActive: true });

    if (branchId) {
      expenseQuery.andWhere('expense.branchId = :branchId', { branchId });
    } else if (user?.role === 'SITE_OFFICER' && user.branchId) {
      expenseQuery.andWhere('expense.branchId = :branchId', { branchId: user.branchId });
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
      expensesResult,
    ] = await Promise.all([
      (() => {
        const q = this.consignmentRepository
          .createQueryBuilder('consignment')
          .select('COUNT(*)', 'count')
          .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', { start: startDate, end: endDate })
          .andWhere('consignment.isActive = :isActive', { isActive: true })
          .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES });
        applyBranchFilter(q);
        return q.getRawOne();
      })(),
      (() => {
        const q = this.consignmentRepository
          .createQueryBuilder('consignment')
          .select('COALESCE(SUM(consignment.totalAmount), 0)', 'total')
          .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', { start: startDate, end: endDate })
          .andWhere('consignment.isActive = :isActive', { isActive: true })
          .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES });
        applyBranchFilter(q);
        return q.getRawOne();
      })(),
      (() => {
        const q = this.consignmentRepository
          .createQueryBuilder('consignment')
          .select('COALESCE(SUM(consignment.paidAmount), 0)', 'total')
          .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', { start: startDate, end: endDate })
          .andWhere('consignment.isActive = :isActive', { isActive: true })
          .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES });
        applyBranchFilter(q);
        return q.getRawOne();
      })(),
      (() => {
        const q = this.consignmentRepository
          .createQueryBuilder('consignment')
          .select('COALESCE(SUM(consignment.remainingAmount), 0)', 'total')
          .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', { start: startDate, end: endDate })
          .andWhere('consignment.isActive = :isActive', { isActive: true })
          .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES });
        applyBranchFilter(q);
        return q.getRawOne();
      })(),
      (() => {
        const query = this.consignmentRepository
          .createQueryBuilder('consignment')
          .select('COUNT(*)', 'count')
          .where('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
          .andWhere('consignment.isActive = :isActive', { isActive: true });
        applyBranchFilter(query);
        return query.getRawOne();
      })(),
      (() => {
        const query = this.consignmentRepository
          .createQueryBuilder('consignment')
          .select('COUNT(*)', 'count')
          .where('consignment.status = :status', { status: ConsignmentStatus.IN_TRANSIT })
          .andWhere('consignment.isActive = :isActive', { isActive: true });
        applyBranchFilter(query);
        return query.getRawOne();
      })(),
      (() => {
        const q = this.consignmentRepository
          .createQueryBuilder('consignment')
          .select('COUNT(*)', 'count')
          .where('consignment.status = :status', { status: ConsignmentStatus.DELIVERED })
          .andWhere('consignment.deliveredAt >= :start AND consignment.deliveredAt <= :end', {
            start: startDate,
            end: endDate,
          })
          .andWhere('consignment.isActive = :isActive', { isActive: true });
        applyBranchFilter(q);
        return q.getRawOne();
      })(),
      (() => {
        const q = this.consignmentRepository
          .createQueryBuilder('consignment')
          .select('COALESCE(SUM(consignment.remainingAmount), 0)', 'total')
          .where('consignment.paymentStatus = :status', { status: PaymentStatus.TO_PAY })
          .andWhere('consignment.isActive = :isActive', { isActive: true })
          .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES });
        applyBranchFilter(q);
        return q.getRawOne();
      })(),
      expenseQuery.getRawOne(),
    ]);

    const todayRevenue = Number(revenueResult?.total) || 0;
    const todayPaidAmount = Number(paidAmountResult?.total) || 0;
    const totalExpenses = Number(expensesResult?.total) || 0;
    /** Freight booked (sum of consignment totals in range) minus all expenses in range (incl. manifest dispatch costs). */
    const estimatedProfit = todayRevenue - totalExpenses;

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

  async getRecentConsignments(limit = 10, branchId?: string, status?: string): Promise<Consignment[]> {
    const where: any = { isActive: true };
    if (branchId) {
      where.fromBranchId = branchId;
    }
    if (status) {
      where.status = status;
    }
    return this.consignmentRepository.find({
      where,
      relations: ['sender', 'receiver', 'fromCity', 'toCity', 'fromBranch', 'toBranch'],
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

  async getAdminStats(period: 'day' | 'week' | 'month' | 'all' = 'all', branchId?: string): Promise<AdminDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate: Date;
    const dayMs = 24 * 60 * 60 * 1000;
    
    switch (period) {
      case 'day':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * dayMs);
        break;
      case 'month':
        startDate = new Date(today.getTime() - 30 * dayMs);
        break;
      default:
        startDate = new Date('2000-01-01');
    }

    const revenueQuery = this.consignmentRepository
      .createQueryBuilder('consignment')
      .select('DATE(consignment.createdAt)', 'date')
      .addSelect('COALESCE(SUM(consignment.totalAmount), 0)', 'revenue')
      .where('consignment.createdAt >= :start', { start: startDate })
      .andWhere('consignment.isActive = :isActive', { isActive: true })
      .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES });
    
    if (branchId) {
      revenueQuery.andWhere('consignment.fromBranchId = :branchId', { branchId });
    }
    
    const revenueChart = await revenueQuery.groupBy('DATE(consignment.createdAt)').orderBy('date', 'ASC').getRawMany();

    const expenseByDayQuery = this.expenseRepository
      .createQueryBuilder('expense')
      .select('DATE(expense.createdAt)', 'date')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'expenses')
      .where('expense.createdAt >= :start', { start: startDate })
      .andWhere('expense.isActive = :isActive', { isActive: true });
    if (branchId) {
      expenseByDayQuery.andWhere('expense.branchId = :branchId', { branchId });
    }
    const expenseByDay = await expenseByDayQuery
      .groupBy('DATE(expense.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const expenseByDayMap = new Map<string, number>();
    for (const row of expenseByDay) {
      expenseByDayMap.set(String(row.date), Number(row.expenses) || 0);
    }

    const revenueChartWithProfit = revenueChart.map((row) => {
      const revenue = Number(row.revenue) || 0;
      const dayExpenses = expenseByDayMap.get(String(row.date)) || 0;
      return {
        ...row,
        revenue,
        profit: revenue - dayExpenses,
      };
    });

    const totalRevenue = revenueChartWithProfit.reduce((sum, r) => sum + Number(r.revenue), 0);
    const totalExpensesInPeriod = Array.from(expenseByDayMap.values()).reduce((a, b) => a + b, 0);
    const totalProfit = totalRevenue - totalExpensesInPeriod;

    const expenseBreakdownQuery = this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.type', 'type')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'amount')
      .where('expense.createdAt >= :start', { start: startDate })
      .andWhere('expense.isActive = :isActive', { isActive: true });
    if (branchId) {
      expenseBreakdownQuery.andWhere('expense.branchId = :branchId', { branchId });
    }
    const expenseBreakdownRows = await expenseBreakdownQuery.groupBy('expense.type').orderBy('amount', 'DESC').getRawMany();
    const expenseBreakdown = expenseBreakdownRows.map((b) => ({
      category: b.type || 'Other',
      amount: Number(b.amount) || 0,
    }));

    const totalConsignments = await this.consignmentRepository.count({
      where: { ...(branchId ? { fromBranchId: branchId } : {}), isActive: true, status: In(DASHBOARD_STATUSES) },
    });

    const pendingDeliveries = await this.consignmentRepository.count({
      where: { 
        ...(branchId ? { fromBranchId: branchId } : {}),
        isActive: true,
        status: In([ConsignmentStatus.IN_TRANSIT, ConsignmentStatus.ARRIVED]),
      },
    });

    const recentConsignments = await this.consignmentRepository.find({
      where: { isActive: true, status: In(DASHBOARD_STATUSES) },
      relations: ['sender', 'receiver', 'fromCity', 'toCity', 'fromBranch'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      summary: {
        todayRevenue: totalRevenue,
        monthRevenue: totalRevenue,
        totalProfit,
        totalConsignments,
        pendingDeliveries,
      },
      revenueChart: revenueChartWithProfit,
      branchPerformance: [],
      routePerformance: [],
      expenseBreakdown,
      recentConsignments,
    };
  }

  async getManagerStats(branchId: string, period: 'day' | 'week' | 'month' | 'all' = 'all'): Promise<ManagerDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const dayMs = 24 * 60 * 60 * 1000;
    let startDate: Date;
    switch (period) {
      case 'day':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * dayMs);
        break;
      case 'month':
        startDate = new Date(today.getTime() - 30 * dayMs);
        break;
      default:
        startDate = new Date('2000-01-01');
    }

    const [
      todayBookingsResult,
      revenueResult,
      expensesTodayResult,
      pendingResult,
      deliveredResult,
      branchConsignments,
      incomingParcels,
      outgoingParcels,
      dailyRevenueResult,
      bookingsCountResult,
    ] = await Promise.all([
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', { start: today, end: endOfToday })
        .andWhere('consignment.fromBranchId = :branchId', { branchId })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COALESCE(SUM(consignment.totalAmount), 0)', 'total')
        .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', { start: today, end: endOfToday })
        .andWhere('consignment.fromBranchId = :branchId', { branchId })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
        .getRawOne(),
      this.expenseRepository
        .createQueryBuilder('expense')
        .select('COALESCE(SUM(expense.amount), 0)', 'total')
        .where('expense.createdAt >= :start AND expense.createdAt <= :end', { start: today, end: endOfToday })
        .andWhere('expense.branchId = :branchId', { branchId })
        .andWhere('expense.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .where('consignment.toBranchId = :branchId', { branchId })
        .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .where('consignment.toBranchId = :branchId', { branchId })
        .andWhere('consignment.status = :status', { status: ConsignmentStatus.DELIVERED })
        .andWhere('consignment.deliveredAt >= :start AND consignment.deliveredAt <= :end', { start: today, end: endOfToday })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository.find({
        where: { fromBranchId: branchId, isActive: true, status: In(DASHBOARD_STATUSES) },
        relations: ['sender', 'receiver', 'fromCity', 'toCity'],
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.consignmentRepository.find({
        where: { toBranchId: branchId, status: ConsignmentStatus.ARRIVED, isActive: true },
        relations: ['sender', 'receiver', 'fromCity', 'toCity'],
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.consignmentRepository.find({
        where: { fromBranchId: branchId, status: ConsignmentStatus.IN_TRANSIT, isActive: true },
        relations: ['sender', 'receiver', 'fromCity', 'toCity'],
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('DATE(consignment.createdAt)', 'date')
        .addSelect('COALESCE(SUM(consignment.totalAmount), 0)', 'revenue')
        .where('consignment.fromBranchId = :branchId', { branchId })
        .andWhere('consignment.createdAt >= :start', { start: startDate })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
        .groupBy('DATE(consignment.createdAt)')
        .getRawMany(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('DATE(consignment.createdAt)', 'date')
        .addSelect('COUNT(*)', 'count')
        .where('consignment.fromBranchId = :branchId', { branchId })
        .andWhere('consignment.createdAt >= :start', { start: startDate })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
        .groupBy('DATE(consignment.createdAt)')
        .getRawMany(),
    ]);

    const todayRevenue = Number(revenueResult?.total) || 0;
    const todayExpenses = Number(expensesTodayResult?.total) || 0;

    const dailyRevenue = dailyRevenueResult.map((row: any) => ({
      date: new Date(row.date).toString(),
      revenue: Number(row.revenue) || 0,
    }));

    const bookingsCount = bookingsCountResult.map((row: any) => ({
      date: new Date(row.date).toString(),
      count: parseInt(row.count) || 0,
    }));

    return {
      todayBookings: parseInt(todayBookingsResult?.count || '0'),
      todayRevenue,
      todayExpenses,
      estimatedProfit: todayRevenue - todayExpenses,
      pendingDeliveries: parseInt(pendingResult?.count || '0'),
      deliveredToday: parseInt(deliveredResult?.count || '0'),
      dailyRevenue,
      bookingsCount,
      branchConsignments,
      incomingParcels,
      outgoingParcels,
      warehouseItems: [],
    };
  }

  async getSiteOfficerStats(branchId: string): Promise<SiteOfficerDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      todayBookingsResult,
      pendingResult,
      incomingResult,
      pendingConsignments,
      inTransitConsignments,
      arrivedConsignments,
      deliveredConsignments,
    ] = await Promise.all([
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', { start: today, end: endOfToday })
        .andWhere('consignment.fromBranchId = :branchId', { branchId })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .where('consignment.toBranchId = :branchId', { branchId })
        .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .where('consignment.toBranchId = :branchId', { branchId })
        .andWhere('consignment.status = :status', { status: ConsignmentStatus.ARRIVED })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
      this.consignmentRepository.find({
        where: { 
          fromBranchId: branchId,
          status: ConsignmentStatus.BOOKED,
          isActive: true 
        },
        relations: ['sender', 'receiver', 'fromCity', 'toCity'],
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.consignmentRepository.find({
        where: { 
          fromBranchId: branchId,
          status: ConsignmentStatus.IN_TRANSIT,
          isActive: true 
        },
        relations: ['sender', 'receiver', 'fromCity', 'toCity'],
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.consignmentRepository.find({
        where: { 
          toBranchId: branchId,
          status: ConsignmentStatus.ARRIVED,
          isActive: true 
        },
        relations: ['sender', 'receiver', 'fromCity', 'toCity'],
        order: { createdAt: 'DESC' },
        take: 20,
      }),
      this.consignmentRepository.find({
        where: { 
          toBranchId: branchId,
          status: ConsignmentStatus.DELIVERED,
          isActive: true 
        },
        relations: ['sender', 'receiver', 'fromCity', 'toCity'],
        order: { deliveredAt: 'DESC' },
        take: 20,
      }),
    ]);

    return {
      todayBookings: parseInt(todayBookingsResult?.count || '0'),
      pendingDeliveries: parseInt(pendingResult?.count || '0'),
      incomingParcels: parseInt(incomingResult?.count || '0'),
      pendingConsignments,
      inTransitConsignments,
      arrivedConsignments,
      deliveredConsignments,
    };
  }

  async getBranchPerformance(branchId?: string, period: 'day' | 'week' | 'month' | 'all' = 'all') {
    if (branchId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dayMs = 24 * 60 * 60 * 1000;
      let startDate: Date;
      switch (period) {
        case 'day':
          startDate = today;
          break;
        case 'week':
          startDate = new Date(today.getTime() - 7 * dayMs);
          break;
        case 'month':
          startDate = new Date(today.getTime() - 30 * dayMs);
          break;
        default:
          startDate = new Date('2000-01-01');
      }

      const [totalQuery, deliveredQuery, pendingQuery] = await Promise.all([
        this.consignmentRepository
          .createQueryBuilder('consignment')
          .select('DATE(consignment.createdAt)', 'date')
          .addSelect('COUNT(*)', 'count')
          .where('consignment.fromBranchId = :branchId', { branchId })
          .andWhere('consignment.isActive = :isActive', { isActive: true })
          .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
          .andWhere('consignment.createdAt >= :startDate', { startDate })
           .groupBy('DATE(consignment.createdAt)')
          .getRawMany(),
        this.consignmentRepository
          .createQueryBuilder('consignment')
          .select('DATE(consignment.createdAt)', 'date')
          .addSelect('COUNT(*)', 'count')
          .where('consignment.fromBranchId = :branchId', { branchId })
          .andWhere('consignment.isActive = :isActive', { isActive: true })
          .andWhere('consignment.status = :delivered', { delivered: ConsignmentStatus.DELIVERED })
          .andWhere('consignment.createdAt >= :startDate', { startDate })
          .groupBy('DATE(consignment.createdAt)')
          .getRawMany(),
        this.consignmentRepository
          .createQueryBuilder('consignment')
          .select('DATE(consignment.createdAt)', 'date')
          .addSelect('COUNT(*)', 'count')
          .where('consignment.fromBranchId = :branchId', { branchId })
          .andWhere('consignment.isActive = :isActive', { isActive: true })
          .andWhere('consignment.status != :delivered', { delivered: ConsignmentStatus.DELIVERED })
          .andWhere('consignment.status != :cancelled', { cancelled: ConsignmentStatus.CANCELLED })
          .andWhere('consignment.createdAt >= :startDate', { startDate })
          .groupBy('DATE(consignment.createdAt)')
          .getRawMany(),
      ]);

      const totalMap = new Map<string, number>();
      for (const row of totalQuery) {
        totalMap.set(row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date), parseInt(row.count) || 0);
      }
      const deliveredMap = new Map<string, number>();
      for (const row of deliveredQuery) {
        deliveredMap.set(row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date), parseInt(row.count) || 0);
      }
      const pendingMap = new Map<string, number>();
      for (const row of pendingQuery) {
        pendingMap.set(row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date), parseInt(row.count) || 0);
      }

      const allDates = new Set<string>();
      for (const row of totalQuery) allDates.add(row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date));
      for (const row of deliveredQuery) allDates.add(row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date));
      for (const row of pendingQuery) allDates.add(row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date));

      return Array.from(allDates).map((date) => ({
        date: new Date(date).toString(),
        completedDeliveries: deliveredMap.get(date) || 0,
        pendingOrders: pendingMap.get(date) || 0,
        totalConsignments: totalMap.get(date) || 0,
      }));
    }

    const branches = await this.branchRepository.find({ where: { isActive: true } });
    const performance = await Promise.all(
      branches.map(async (branch) => {
         const [bookingsResult, revenueResult, expensesResult] = await Promise.all([
           this.consignmentRepository
             .createQueryBuilder('consignment')
             .select('COUNT(*)', 'count')
             .where('consignment.fromBranchId = :branchId', { branchId: branch.id })
             .andWhere('consignment.isActive = :isActive', { isActive: true })
             .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
             .getRawOne(),
           this.consignmentRepository
             .createQueryBuilder('consignment')
             .select('COALESCE(SUM(consignment.totalAmount), 0)', 'total')
             .where('consignment.fromBranchId = :branchId', { branchId: branch.id })
             .andWhere('consignment.isActive = :isActive', { isActive: true })
             .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
             .getRawOne(),
           this.expenseRepository
             .createQueryBuilder('expense')
             .select('COALESCE(SUM(expense.amount), 0)', 'total')
             .where('expense.branchId = :branchId', { branchId: branch.id })
             .andWhere('expense.isActive = :isActive', { isActive: true })
             .getRawOne(),
         ]);
        const revenue = Number(revenueResult?.total) || 0;
        const expenses = Number(expensesResult?.total) || 0;
        return {
          branchName: branch.name,
          totalBookings: parseInt(bookingsResult?.count || '0'),
          revenue,
          profit: revenue - expenses,
        };
      })
    );
    return performance;
  }

  async getRoutePerformance() {
    const routes = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .select('fromCity.name', 'fromCity')
      .addSelect('toCity.name', 'toCity')
      .addSelect('COUNT(*)', 'bookings')
      .addSelect('COALESCE(SUM(consignment.totalAmount), 0)', 'revenue')
      .leftJoin('consignment.fromCity', 'fromCity')
      .leftJoin('consignment.toCity', 'toCity')
      .where('consignment.isActive = :isActive', { isActive: true })
      .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
      .groupBy('fromCity.name, toCity.name')
      .orderBy('bookings', 'DESC')
      .limit(10)
      .getRawMany();
    
    return routes.map(r => ({
      route: `${r.fromCity || '-'} → ${r.toCity || '-'}`,
      bookings: parseInt(r.bookings) || 0,
      revenue: Number(r.revenue) || 0,
    }));
  }

  async getExpenseBreakdown() {
    const breakdown = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.type', 'type')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'amount')
      .where('expense.isActive = :isActive', { isActive: true })
      .groupBy('expense.type')
      .orderBy('amount', 'DESC')
      .getRawMany();
    
    return breakdown.map(b => ({
      category: b.type || 'Other',
      amount: Number(b.amount) || 0,
    }));
  }

  async getRevenueChart(period: 'day' | 'week' | 'month' | 'all' = 'all', branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    const dayMs = 24 * 60 * 60 * 1000;

    switch (period) {
      case 'day':
        startDate = today;
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * dayMs);
        break;
      case 'month':
        startDate = new Date(today.getTime() - 30 * dayMs);
        break;
      default:
        startDate = new Date('2000-01-01');
    }

    // Get revenue from consignments
    const revenueQuery = this.consignmentRepository
      .createQueryBuilder('consignment')
      .select('DATE(consignment.createdAt)', 'date')
      .addSelect('COALESCE(SUM(consignment.totalAmount), 0)', 'revenue')
      .where('consignment.createdAt >= :start', { start: startDate })
      .andWhere('consignment.isActive = :isActive', { isActive: true })
      .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES });
    if (branchId) {
      revenueQuery.andWhere('consignment.fromBranchId = :branchId', { branchId });
    }
    const revenueData = await revenueQuery.groupBy('DATE(consignment.createdAt)').orderBy('date', 'ASC').getRawMany();

    const expenseQuery = this.expenseRepository
      .createQueryBuilder('expense')
      .select('DATE(expense.createdAt)', 'date')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'expenses')
      .where('expense.createdAt >= :start', { start: startDate })
      .andWhere('expense.isActive = :isActive', { isActive: true });
    if (branchId) {
      expenseQuery.andWhere('expense.branchId = :branchId', { branchId });
    }
    const expenseData = await expenseQuery.groupBy('DATE(expense.createdAt)').orderBy('date', 'ASC').getRawMany();

    const expenseMap = new Map<string, number>();
    for (const row of expenseData) {
      expenseMap.set(String(row.date), Number(row.expenses) || 0);
    }

    return revenueData.map((row) => {
      const revenue = Number(row.revenue) || 0;
      const dayExpenses = expenseMap.get(String(row.date)) || 0;
      return {
        date: row.date,
        revenue,
        profit: revenue - dayExpenses,
      };
    });
  }

  // ===== ACCOUNTING DASHBOARD METHODS =====

  /**
   * Get accounting dashboard overview metrics
   */
  async getAccountingDashboardMetrics(
    dateFrom?: string,
    dateTo?: string,
    branchId?: string,
    paymentStatus?: string,
  ) {
    const startDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
    const endDate = dateTo ? new Date(dateTo) : new Date();

    const baseConsignmentQuery = this.consignmentRepository
      .createQueryBuilder('consignment')
      .where('consignment.isActive = :isActive', { isActive: true })
      .andWhere('consignment.createdAt >= :startDate', { startDate })
      .andWhere('consignment.createdAt <= :endDate', { endDate });

    if (branchId) {
      baseConsignmentQuery.andWhere('consignment.fromBranchId = :branchId', { branchId });
    }

    if (paymentStatus) {
      baseConsignmentQuery.andWhere('consignment.paymentStatus = :paymentStatus', { paymentStatus });
    }

    const [totalRevenue, totalPaid, totalRemaining, totalExpenses] = await Promise.all([
      baseConsignmentQuery
        .clone()
        .select('COALESCE(SUM(consignment.totalAmount), 0)', 'total')
        .getRawOne(),
      baseConsignmentQuery
        .clone()
        .select('COALESCE(SUM(consignment.paidAmount), 0)', 'total')
        .getRawOne(),
      baseConsignmentQuery
        .clone()
        .select('COALESCE(SUM(consignment.remainingAmount), 0)', 'total')
        .getRawOne(),
      this.expenseRepository
        .createQueryBuilder('expense')
        .select('COALESCE(SUM(expense.amount), 0)', 'total')
        .where('expense.isActive = :isActive', { isActive: true })
        .andWhere('expense.createdAt >= :startDate', { startDate })
        .andWhere('expense.createdAt <= :endDate', { endDate })
        .andWhere(branchId ? 'expense.branchId = :branchId' : '1=1', branchId ? { branchId } : {})
        .getRawOne(),
    ]);

    const revenuAmount = Number(totalRevenue?.total) || 0;
    const paidAmount = Number(totalPaid?.total) || 0;
    const remainingAmount = Number(totalRemaining?.total) || 0;
    const expensesAmount = Number(totalExpenses?.total) || 0;
    const netProfit = revenuAmount - expensesAmount;

    return {
      totalRevenue: revenuAmount,
      totalPaidAmount: paidAmount,
      totalRemainingAmount: remainingAmount,
      totalExpenses: expensesAmount,
      netProfit,
      toPayAmount: remainingAmount,
    };
  }

  /**
   * Get detailed revenue data for revenue management section
   */
  async getRevenueDetails(
    dateFrom?: string,
    dateTo?: string,
    branchId?: string,
    paymentStatus?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const startDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
    const endDate = dateTo ? new Date(dateTo) : new Date();
    const skip = (page - 1) * limit;

    const query = this.consignmentRepository
      .createQueryBuilder('consignment')
      .leftJoinAndSelect('consignment.fromBranch', 'fromBranch')
      .leftJoinAndSelect('consignment.toBranch', 'toBranch')
      .where('consignment.isActive = :isActive', { isActive: true })
      .andWhere('consignment.createdAt >= :startDate', { startDate })
      .andWhere('consignment.createdAt <= :endDate', { endDate });

    if (branchId) {
      query.andWhere('consignment.fromBranchId = :branchId', { branchId });
    }

    if (paymentStatus) {
      query.andWhere('consignment.paymentStatus = :paymentStatus', { paymentStatus });
    }

    const [data, total] = await query
      .orderBy('consignment.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((c) => ({
        id: c.id,
        biltyNumber: c.biltyNumber,
        totalAmount: Number(c.totalAmount),
        paidAmount: Number(c.paidAmount),
        remainingAmount: Number(c.remainingAmount),
        paymentStatus: c.paymentStatus,
        bookingDate: c.createdAt,
        deliveryDate: c.deliveredAt,
        fromBranch: c.fromBranch?.name,
        toBranch: c.toBranch?.name,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get payment tracking data
   */
  async getPaymentTracking(
    dateFrom?: string,
    dateTo?: string,
    branchId?: string,
    paymentType?: string,
    paymentMethod?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const startDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
    const endDate = dateTo ? new Date(dateTo) : new Date();
    const skip = (page - 1) * limit;

    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.consignment', 'consignment')
      .where('payment.isActive = :isActive', { isActive: true })
      .andWhere('payment.createdAt >= :startDate', { startDate })
      .andWhere('payment.createdAt <= :endDate', { endDate });

    if (branchId) {
      query.leftJoin('consignment.fromBranch', 'branch').andWhere('branch.id = :branchId', { branchId });
    }

    if (paymentType) {
      query.andWhere('payment.type = :paymentType', { paymentType });
    }

    if (paymentMethod) {
      query.andWhere('payment.method = :paymentMethod', { paymentMethod });
    }

    const [data, total] = await query
      .orderBy('payment.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((p) => ({
        id: p.id,
        consignmentId: p.consignmentId,
        biltyNumber: p.consignment?.biltyNumber,
        amount: Number(p.amount),
        type: p.type,
        method: p.method,
        createdAt: p.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get profit and loss data for a given period
   */
  async getProfitAndLoss(
    period: 'daily' | 'monthly' | 'custom' = 'daily',
    dateFrom?: string,
    dateTo?: string,
    branchId?: string,
  ) {
    const startDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
    const endDate = dateTo ? new Date(dateTo) : new Date();

    const revenueQuery = this.consignmentRepository
      .createQueryBuilder('consignment')
      .select(
        period === 'monthly'
          ? 'TO_CHAR(consignment.createdAt, \'YYYY-MM\')'
          : 'DATE(consignment.createdAt)',
        'period',
      )
      .addSelect('COALESCE(SUM(consignment.totalAmount), 0)', 'revenue')
      .where('consignment.isActive = :isActive', { isActive: true })
      .andWhere('consignment.createdAt >= :startDate', { startDate })
      .andWhere('consignment.createdAt <= :endDate', { endDate });

    if (branchId) {
      revenueQuery.andWhere('consignment.fromBranchId = :branchId', { branchId });
    }

    const revenueData = await revenueQuery
      .groupBy(period === 'monthly' ? 'TO_CHAR(consignment.createdAt, \'YYYY-MM\')' : 'DATE(consignment.createdAt)')
      .orderBy('period', 'ASC')
      .getRawMany();

    const expenseQuery = this.expenseRepository
      .createQueryBuilder('expense')
      .select(
        period === 'monthly'
          ? 'TO_CHAR(expense.createdAt, \'YYYY-MM\')'
          : 'DATE(expense.createdAt)',
        'period',
      )
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'expenses')
      .where('expense.isActive = :isActive', { isActive: true })
      .andWhere('expense.createdAt >= :startDate', { startDate })
      .andWhere('expense.createdAt <= :endDate', { endDate });

    if (branchId) {
      expenseQuery.andWhere('expense.branchId = :branchId', { branchId });
    }

    const expenseData = await expenseQuery
      .groupBy(period === 'monthly' ? 'TO_CHAR(expense.createdAt, \'YYYY-MM\')' : 'DATE(expense.createdAt)')
      .orderBy('period', 'ASC')
      .getRawMany();

    const expenseMap = new Map<string, number>();
    for (const row of expenseData) {
      expenseMap.set(String(row.period), Number(row.expenses) || 0);
    }

    return revenueData.map((row) => {
      const revenue = Number(row.revenue) || 0;
      const expenses = expenseMap.get(String(row.period)) || 0;
      return {
        period: row.period,
        revenue,
        expenses,
        profit: revenue - expenses,
      };
    });
  }

  /**
   * Get cash flow management data
   */
  async getCashFlow(
    dateFrom?: string,
    dateTo?: string,
    branchId?: string,
  ) {
    const startDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
    startDate.setHours(0, 0, 0, 0);
    const endDate = dateTo ? new Date(dateTo) : new Date();
    endDate.setHours(23, 59, 59, 999);

    // Cash In = Payments received
    const cashInQuery = this.paymentRepository
      .createQueryBuilder('payment')
      .select("CAST(payment.createdAt AS date)", 'date')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .where('payment.isActive = :isActive', { isActive: true })
      .andWhere('payment.createdAt >= :startDate', { startDate })
      .andWhere('payment.createdAt <= :endDate', { endDate });

    if (branchId) {
      cashInQuery.leftJoin('payment.consignment', 'consignment').andWhere('consignment.fromBranchId = :branchId', {
        branchId,
      });
    }

    const cashInData = await cashInQuery.groupBy('CAST(payment.createdAt AS date)').orderBy('date', 'ASC').getRawMany();

    // Cash Out = Expenses
    const cashOutQuery = this.expenseRepository
      .createQueryBuilder('expense')
      .select("CAST(expense.createdAt AS date)", 'date')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'amount')
      .where('expense.isActive = :isActive', { isActive: true })
      .andWhere('expense.createdAt >= :startDate', { startDate })
      .andWhere('expense.createdAt <= :endDate', { endDate });

    if (branchId) {
      cashOutQuery.andWhere('expense.branchId = :branchId', { branchId });
    }

    const cashOutData = await cashOutQuery.groupBy('CAST(expense.createdAt AS date)').orderBy('date', 'ASC').getRawMany();

    // Calculate cumulative balance
    const cashInMap = new Map<string, number>();
    const cashOutMap = new Map<string, number>();

    const formatDateKey = (d: any) => {
      if (d instanceof Date) return d.toISOString().split('T')[0];
      return String(d).split('T')[0];
    };

    for (const row of cashInData) {
      cashInMap.set(formatDateKey(row.date), Number(row.amount) || 0);
    }

    for (const row of cashOutData) {
      cashOutMap.set(formatDateKey(row.date), Number(row.amount) || 0);
    }

    // Only include dates that have data
    const allDates = new Set<string>([...cashInMap.keys(), ...cashOutMap.keys()]);

    let runningBalance = 0;
    const cashFlowData = Array.from(allDates)
      .sort()
      .map((dateStr) => {
        const cashIn = cashInMap.get(dateStr) || 0;
        const cashOut = cashOutMap.get(dateStr) || 0;
        runningBalance += cashIn - cashOut;
        return {
          date: dateStr,
          openingBalance: runningBalance - (cashIn - cashOut),
          cashIn,
          cashOut,
          closingBalance: runningBalance,
        };
      });

    return cashFlowData;
  }

  /**
   * Get summary totals for cash flow
   */
  async getCashFlowSummary(
    dateFrom?: string,
    dateTo?: string,
    branchId?: string,
  ) {
    const startDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01');
    startDate.setHours(0, 0, 0, 0);
    const endDate = dateTo ? new Date(dateTo) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const [totalCashIn, totalCashOut] = await Promise.all([
      (() => {
        const q = this.paymentRepository
          .createQueryBuilder('payment')
          .select('COALESCE(SUM(payment.amount), 0)', 'total')
          .where('payment.isActive = :isActive', { isActive: true })
          .andWhere('payment.createdAt >= :startDate', { startDate })
          .andWhere('payment.createdAt <= :endDate', { endDate });
        if (branchId) {
          q.leftJoin('payment.consignment', 'consignment')
            .andWhere('consignment.fromBranchId = :branchId', { branchId });
        }
        return q.getRawOne();
      })(),
      (() => {
        const q = this.expenseRepository
          .createQueryBuilder('expense')
          .select('COALESCE(SUM(expense.amount), 0)', 'total')
          .where('expense.isActive = :isActive', { isActive: true })
          .andWhere('expense.createdAt >= :startDate', { startDate })
          .andWhere('expense.createdAt <= :endDate', { endDate });
        if (branchId) {
          q.andWhere('expense.branchId = :branchId', { branchId });
        }
        return q.getRawOne();
      })(),
    ]);

    const cashIn = Number(totalCashIn?.total) || 0;
    const cashOut = Number(totalCashOut?.total) || 0;

    return {
      openingBalance: 0, // This would need to be tracked separately
      totalCashIn: cashIn,
      totalCashOut: cashOut,
      closingBalance: cashIn - cashOut,
    };
  }
}