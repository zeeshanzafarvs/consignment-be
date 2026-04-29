import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Consignment } from '../consignments/entities/consignment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Payment } from '../payments/entities/payment.entity';
import { DispatchManifest } from '../dispatch-manifests/entities/dispatch-manifest.entity';
import { ManifestItem } from '../dispatch-manifests/entities/manifest-item.entity';
import { ConsignmentStatus } from '../../common/enums/status.enum';
import { User } from '../users/entities/user.entity';

export interface DailyBookingReport {
  consignments: any[];
  totals: {
    totalConsignments: number;
    totalQuantity: number;
    totalWeight: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
  };
}

export interface ManifestReport {
  manifest: any;
  consignments: any[];
  totals: {
    totalConsignments: number;
    totalQuantity: number;
    totalWeight: number;
    totalAmount: number;
    totalPaid: number;
  };
}

export interface DeliveryReceipt {
  consignment: any;
  payments: any[];
}

export interface CustomerLedger {
  customer: any;
  consignments: any[];
  totals: {
    totalConsignments: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
  };
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Consignment)
    private consignmentRepository: Repository<Consignment>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(DispatchManifest)
    private manifestRepository: Repository<DispatchManifest>,
    @InjectRepository(ManifestItem)
    private manifestItemRepository: Repository<ManifestItem>,
  ) {}

  async getDailyBookings(date: string, branchId?: string, user?: User): Promise<DailyBookingReport> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const queryBuilder = this.consignmentRepository
      .createQueryBuilder('consignment')
      .leftJoinAndSelect('consignment.sender', 'sender')
      .leftJoinAndSelect('consignment.receiver', 'receiver')
      .leftJoinAndSelect('consignment.fromCity', 'fromCity')
      .leftJoinAndSelect('consignment.toCity', 'toCity')
      .leftJoinAndSelect('consignment.fromBranch', 'fromBranch')
      .leftJoinAndSelect('consignment.toBranch', 'toBranch')
      .leftJoinAndSelect('consignment.createdBy', 'createdBy')
      .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .andWhere('consignment.isActive = :isActive', { isActive: true })
      .andWhere('consignment.status != :status', { status: ConsignmentStatus.CANCELLED });

    if (branchId) {
      queryBuilder.andWhere('consignment.fromBranchId = :branchId', { branchId });
    }

    if (user?.role === 'MANAGER' && user.branchId) {
      queryBuilder.andWhere(
        '(consignment.fromBranchId = :branchId OR consignment.toBranchId = :branchId)',
        { branchId: user.branchId },
      );
    } else if (user?.role === 'SITE_OFFICER' && user.branchId) {
      queryBuilder.andWhere(
        '(consignment.fromBranchId = :branchId OR consignment.toBranchId = :branchId)',
        { branchId: user.branchId },
      );
    }

    const [consignments, totalResult] = await Promise.all([
      queryBuilder.orderBy('consignment.createdAt', 'ASC').getMany(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(consignment.quantity), 0)', 'quantity')
        .addSelect('COALESCE(SUM(consignment.weight), 0)', 'weight')
        .addSelect('COALESCE(SUM(consignment.totalAmount), 0)', 'totalAmount')
        .addSelect('COALESCE(SUM(consignment.paidAmount), 0)', 'totalPaid')
        .addSelect('COALESCE(SUM(consignment.remainingAmount), 0)', 'totalRemaining')
        .where('consignment.createdAt >= :start AND consignment.createdAt <= :end', {
          start: startOfDay,
          end: endOfDay,
        })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .andWhere('consignment.status != :status', { status: ConsignmentStatus.CANCELLED })
        .getRawOne(),
    ]);

    return {
      consignments,
      totals: {
        totalConsignments: consignments.length,
        totalQuantity: parseInt(totalResult?.quantity) || 0,
        totalWeight: Number(totalResult?.weight) || 0,
        totalAmount: Number(totalResult?.totalAmount) || 0,
        totalPaid: Number(totalResult?.totalPaid) || 0,
        totalRemaining: Number(totalResult?.totalRemaining) || 0,
      },
    };
  }

  async getManifestReport(manifestId: string): Promise<ManifestReport> {
    const manifest = await this.manifestRepository.findOne({
      where: { id: manifestId },
      relations: ['vehicle', 'driver', 'fromBranch', 'toBranch', 'createdBy'],
    });

    if (!manifest) {
      throw new NotFoundException('Manifest not found');
    }

    const items = await this.manifestItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.consignment', 'consignment')
      .leftJoinAndSelect('consignment.sender', 'sender')
      .leftJoinAndSelect('consignment.receiver', 'receiver')
      .leftJoinAndSelect('consignment.fromCity', 'fromCity')
      .leftJoinAndSelect('consignment.toCity', 'toCity')
      .where('item.manifestId = :manifestId', { manifestId })
      .getMany();

    let totalQuantity = 0;
    let totalWeight = 0;
    let totalAmount = 0;
    let totalPaid = 0;

    const consignments = items
      .map((item) => {
        const c = item.consignment;
        totalQuantity += Number(c?.quantity || 0);
        totalWeight += Number(c?.weight || 0);
        totalAmount += Number(c?.totalAmount || 0);
        totalPaid += Number(c?.paidAmount || 0);
        return c;
      })
      .filter(Boolean);

    return {
      manifest,
      consignments,
      totals: {
        totalConsignments: consignments.length,
        totalQuantity,
        totalWeight,
        totalAmount,
        totalPaid,
      },
    };
  }

  async getDeliveryReceipt(consignmentId: string): Promise<DeliveryReceipt> {
    const consignment = await this.consignmentRepository.findOne({
      where: { id: consignmentId, isActive: true },
      relations: ['sender', 'receiver', 'fromBranch', 'toBranch', 'fromCity', 'toCity', 'itemType', 'createdBy'],
    });

    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }

    const payments = await this.paymentRepository.find({
      where: { consignmentId },
      order: { createdAt: 'ASC' },
    });

    return {
      consignment,
      payments,
    };
  }

  async getCustomerLedger(customerId: string, user?: User): Promise<CustomerLedger> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['city'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const queryBuilder = this.consignmentRepository
      .createQueryBuilder('consignment')
      .leftJoinAndSelect('consignment.sender', 'sender')
      .leftJoinAndSelect('consignment.receiver', 'receiver')
      .leftJoinAndSelect('consignment.fromCity', 'fromCity')
      .leftJoinAndSelect('consignment.toCity', 'toCity')
      .leftJoinAndSelect('consignment.fromBranch', 'fromBranch')
      .leftJoinAndSelect('consignment.toBranch', 'toBranch')
      .where('(consignment.senderId = :customerId OR consignment.receiverId = :customerId)', {
        customerId,
      })
      .andWhere('consignment.isActive = :isActive', { isActive: true });

    if (user?.role === 'MANAGER' && user.branchId) {
      queryBuilder.andWhere(
        '(consignment.fromBranchId = :branchId OR consignment.toBranchId = :branchId)',
        { branchId: user.branchId },
      );
    } else if (user?.role === 'SITE_OFFICER' && user.branchId) {
      queryBuilder.andWhere(
        '(consignment.fromBranchId = :branchId OR consignment.toBranchId = :branchId)',
        { branchId: user.branchId },
      );
    }

    const [consignments, totalsResult] = await Promise.all([
      queryBuilder.orderBy('consignment.createdAt', 'DESC').getMany(),
      this.consignmentRepository
        .createQueryBuilder('consignment')
        .select('COUNT(*)', 'count')
        .addSelect('COALESCE(SUM(consignment.totalAmount), 0)', 'totalAmount')
        .addSelect('COALESCE(SUM(consignment.paidAmount), 0)', 'totalPaid')
        .addSelect('COALESCE(SUM(consignment.remainingAmount), 0)', 'totalRemaining')
        .where('(consignment.senderId = :customerId OR consignment.receiverId = :customerId)', {
          customerId,
        })
        .andWhere('consignment.isActive = :isActive', { isActive: true })
        .getRawOne(),
    ]);

    return {
      customer,
      consignments,
      totals: {
        totalConsignments: consignments.length,
        totalAmount: Number(totalsResult?.totalAmount) || 0,
        totalPaid: Number(totalsResult?.totalPaid) || 0,
        totalRemaining: Number(totalsResult?.totalRemaining) || 0,
      },
    };
  }
}