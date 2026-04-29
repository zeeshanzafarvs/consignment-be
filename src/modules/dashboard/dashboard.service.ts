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

  async getAdminStats(period: 'day' | 'week' | 'month' = 'day', branchId?: string): Promise<AdminDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate: Date;
    const dayMs = 24 * 60 * 60 * 1000;
    
    switch (period) {
      case 'week':
        startDate = new Date(today.getTime() - 7 * dayMs);
        break;
      case 'month':
        startDate = new Date(today.getTime() - 30 * dayMs);
        break;
      default:
        startDate = today;
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
      where: { isActive: true, status: In(DASHBOARD_STATUSES) },
    });

    const pendingDeliveries = await this.consignmentRepository.count({
      where: { 
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

  async getManagerStats(branchId: string): Promise<ManagerDashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      todayBookingsResult,
      revenueResult,
      expensesTodayResult,
      pendingResult,
      deliveredResult,
      branchConsignments,
      incomingParcels,
      outgoingParcels,
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
    ]);

    const todayRevenue = Number(revenueResult?.total) || 0;
    const todayExpenses = Number(expensesTodayResult?.total) || 0;

    return {
      todayBookings: parseInt(todayBookingsResult?.count || '0'),
      todayRevenue,
      todayExpenses,
      estimatedProfit: todayRevenue - todayExpenses,
      pendingDeliveries: parseInt(pendingResult?.count || '0'),
      deliveredToday: parseInt(deliveredResult?.count || '0'),
      dailyRevenue: [],
      bookingsCount: [],
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
          status: In(DASHBOARD_STATUSES),
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

  async getBranchPerformance() {
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

  async getRevenueChart(period: 'day' | 'week' | 'month' = 'day') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    const dayMs = 24 * 60 * 60 * 1000;

    switch (period) {
      case 'week':
        startDate = new Date(today.getTime() - 7 * dayMs);
        break;
      case 'month':
        startDate = new Date(today.getTime() - 30 * dayMs);
        break;
      default:
        startDate = today;
    }

    // Get revenue from consignments
    const revenueData = await this.consignmentRepository
      .createQueryBuilder('consignment')
      .select('DATE(consignment.createdAt)', 'date')
      .addSelect('COALESCE(SUM(consignment.totalAmount), 0)', 'revenue')
      .where('consignment.createdAt >= :start', { start: startDate })
      .andWhere('consignment.isActive = :isActive', { isActive: true })
      .andWhere('consignment.status IN (:...dashboardStatuses)', { dashboardStatuses: DASHBOARD_STATUSES })
      .groupBy('DATE(consignment.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    const expenseData = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('DATE(expense.createdAt)', 'date')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'expenses')
      .where('expense.createdAt >= :start', { start: startDate })
      .andWhere('expense.isActive = :isActive', { isActive: true })
      .groupBy('DATE(expense.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

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
}