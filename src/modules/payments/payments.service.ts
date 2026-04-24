import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Consignment } from '../consignments/entities/consignment.entity';
import { PaymentType, PaymentMethod, ConsignmentStatus, PaymentStatus as ConsignmentPaymentStatus } from '../../common/enums/status.enum';
import { User } from '../users/entities/user.entity';

export interface PaymentFilters {
  consignmentId?: string;
  type?: PaymentType;
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CreateManualPaymentDto {
  consignmentId: string;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Consignment)
    private consignmentRepository: Repository<Consignment>,
  ) {}

  async findAll(
    filters: PaymentFilters,
    pagination: PaginationParams,
  ): Promise<{ data: Payment[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page, limit } = pagination;
    const { consignmentId, type, method, dateFrom, dateTo } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.consignment', 'consignment');

    if (consignmentId) {
      queryBuilder.andWhere('payment.consignmentId = :consignmentId', { consignmentId });
    }
    if (type) {
      queryBuilder.andWhere('payment.type = :type', { type });
    }
    if (method) {
      queryBuilder.andWhere('payment.method = :method', { method });
    }
    if (dateFrom) {
      queryBuilder.andWhere('payment.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }
    if (dateTo) {
      queryBuilder.andWhere('payment.createdAt <= :dateTo', { dateTo: new Date(dateTo) });
    }

    queryBuilder.skip(skip).take(limit).orderBy('payment.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['consignment'],
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async findByConsignment(consignmentId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { consignmentId },
      relations: ['consignment'],
      order: { createdAt: 'DESC' },
    });
  }

  async createManual(dto: CreateManualPaymentDto): Promise<Payment> {
    const consignment = await this.consignmentRepository.findOne({
      where: { id: dto.consignmentId },
    });
    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }
    if (consignment.status === ConsignmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot add payment to cancelled consignment');
    }
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const currentRemaining = Number(consignment.remainingAmount);
    const isAdmin = false;

    if (currentRemaining <= 0 && dto.type !== PaymentType.ADJUSTMENT && !isAdmin) {
      throw new ForbiddenException('Cannot add payment - consignment is already fully paid');
    }

    const payment = this.paymentRepository.create({
      consignmentId: dto.consignmentId,
      amount: dto.amount,
      type: dto.type,
      method: dto.method,
    });
    const savedPayment = await this.paymentRepository.save(payment);

    const newPaidAmount = Number(consignment.paidAmount) + dto.amount;
    const newTotalAmount = Number(consignment.totalAmount);
    const newRemaining = newTotalAmount - newPaidAmount;

    let paymentStatus: ConsignmentPaymentStatus;
    if (newRemaining <= 0) {
      paymentStatus = ConsignmentPaymentStatus.PAID;
    } else if (newPaidAmount > 0) {
      paymentStatus = ConsignmentPaymentStatus.PARTIAL;
    } else {
      paymentStatus = ConsignmentPaymentStatus.TO_PAY;
    }

    await this.consignmentRepository.update(dto.consignmentId, {
      paidAmount: newPaidAmount,
      remainingAmount: newRemaining,
      paymentStatus,
    });

    return this.findOne(savedPayment.id);
  }

  async create(data: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentRepository.create(data);
    return this.paymentRepository.save(payment);
  }

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    const payment = await this.findOne(id);
    Object.assign(payment, data);
    return this.paymentRepository.save(payment);
  }

  async remove(id: string): Promise<void> {
    const payment = await this.findOne(id);
    payment.isActive = false;
    await this.paymentRepository.save(payment);
  }
}