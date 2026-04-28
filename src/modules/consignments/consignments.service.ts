import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Consignment } from './entities/consignment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Payment } from '../payments/entities/payment.entity';
import { ConsignmentStatus, PaymentStatus, PaymentType, PaymentMethod } from '../../common/enums/status.enum';
import { User } from '../users/entities/user.entity';

export enum CustomerType {
  SENDER = 'SENDER',
  RECEIVER = 'RECEIVER',
}

export interface ConsignmentFilters {
  biltyNumber?: string;
  status?: ConsignmentStatus;
  paymentStatus?: PaymentStatus;
  fromCityId?: string;
  toCityId?: string;
  fromBranchId?: string;
  toBranchId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CreateConsignmentDto {
  sender: {
    name: string;
    phone: string;
    address?: string;
    cnic?: string;
    cityId?: string;
  };
  receiver: {
    name: string;
    phone: string;
    address?: string;
    cnic?: string;
    cityId?: string;
  };
  fromBranchId: string;
  toBranchId: string;
  fromCityId: string;
  toCityId: string;
  itemTypeId: string;
  quantity: number;
  weight?: number;
  goodsDescription: string;
  charges: {
    fare: number;
    loading?: number;
    unloading?: number;
    labor?: number;
    warehouse?: number;
    misc?: number;
    stTax?: number;
    ttTax?: number;
    godown?: number;
    handling?: number;
    delivery?: number;
    adjustment?: number;
    previousBalance?: number;
  };
  payment?: {
    paymentStatus?: PaymentStatus;
    paidAmount?: number;
    method?: string;
  };
}

export interface UpdateConsignmentDto {
  goodsDescription?: string;
  quantity?: number;
  weight?: number;
  fromCityId?: string;
  toCityId?: string;
  fromBranchId?: string;
  toBranchId?: string;
  itemTypeId?: string | null;
  charges?: {
    fare?: number;
    loading?: number;
    unloading?: number;
    labor?: number;
    warehouse?: number;
    misc?: number;
    stTax?: number;
    ttTax?: number;
    godown?: number;
    handling?: number;
    delivery?: number;
    adjustment?: number;
    previousBalance?: number;
  };
  payment?: {
    paidAmount?: number;
    method?: string;
  };
}

export interface DeliverConsignmentDto {
  warehouse?: number;
  labor?: number;
  misc?: number;
  paidAmount?: number;
  paymentMethod?: string;
  receiverName?: string;
  remarks?: string;
}

@Injectable()
export class ConsignmentsService {
  constructor(
    @InjectRepository(Consignment)
    private consignmentRepository: Repository<Consignment>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async findAll(
    filters: ConsignmentFilters,
    pagination: PaginationParams,
    user?: User,
  ): Promise<{ data: Consignment[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.consignmentRepository
      .createQueryBuilder('consignment')
      .leftJoinAndSelect('consignment.sender', 'sender')
      .leftJoinAndSelect('consignment.receiver', 'receiver')
      .leftJoinAndSelect('consignment.fromBranch', 'fromBranch')
      .leftJoinAndSelect('consignment.toBranch', 'toBranch')
      .leftJoinAndSelect('consignment.fromCity', 'fromCity')
      .leftJoinAndSelect('consignment.toCity', 'toCity')
      .leftJoinAndSelect('consignment.itemType', 'itemType')
      .leftJoinAndSelect('consignment.createdBy', 'createdBy');

    if (user?.role === 'SITE_OFFICER' && user.branchId) {
      queryBuilder.andWhere('(consignment.fromBranchId = :branchId OR consignment.toBranchId = :branchId)', { branchId: user.branchId });
    } else if (user?.role === 'MANAGER' && user.branchId) {
      queryBuilder.andWhere('(consignment.fromBranchId = :branchId OR consignment.toBranchId = :branchId)', { branchId: user.branchId });
    }

    if (filters.biltyNumber) {
      queryBuilder.andWhere('consignment.biltyNumber ILIKE :biltyNumber', { biltyNumber: `%${filters.biltyNumber}%` });
    }
    if (filters.status) {
      queryBuilder.andWhere('consignment.status = :status', { status: filters.status });
    }
    if (filters.paymentStatus) {
      queryBuilder.andWhere('consignment.paymentStatus = :paymentStatus', { paymentStatus: filters.paymentStatus });
    }
    if (filters.fromCityId) {
      queryBuilder.andWhere('consignment.fromCityId = :fromCityId', { fromCityId: filters.fromCityId });
    }
    if (filters.toCityId) {
      queryBuilder.andWhere('consignment.toCityId = :toCityId', { toCityId: filters.toCityId });
    }
    if (filters.fromBranchId) {
      queryBuilder.andWhere('consignment.fromBranchId = :fromBranchId', { fromBranchId: filters.fromBranchId });
    }
    if (filters.toBranchId) {
      queryBuilder.andWhere('consignment.toBranchId = :toBranchId', { toBranchId: filters.toBranchId });
    }
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      dateFrom.setHours(0, 0, 0, 0);
      queryBuilder.andWhere('consignment.createdAt >= :dateFrom', { dateFrom });
    }
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('consignment.createdAt <= :dateTo', { dateTo });
    }
    if (filters.search) {
      queryBuilder.andWhere(
        '(consignment.biltyNumber ILIKE :search OR sender.name ILIKE :search OR receiver.name ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    queryBuilder.skip(skip).take(limit).orderBy('consignment.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Consignment> {
    const consignment = await this.consignmentRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver', 'fromBranch', 'toBranch', 'fromCity', 'toCity', 'itemType', 'createdBy', 'payments'],
    });
    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }
    return consignment;
  }

  async findByBilty(biltyNumber: string): Promise<Consignment> {
    const consignment = await this.consignmentRepository.findOne({
      where: { biltyNumber },
      relations: ['sender', 'receiver', 'fromBranch', 'toBranch', 'fromCity', 'toCity', 'itemType', 'createdBy', 'payments'],
    });
    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }
    return consignment;
  }

  async create(dto: CreateConsignmentDto, userId?: string): Promise<Consignment> {
    let sender = await this.customerRepository.findOne({ where: { phone: dto.sender.phone } });
    if (!sender) {
      sender = this.customerRepository.create({
        name: dto.sender.name,
        phone: dto.sender.phone,
        address: dto.sender.address,
        cnic: dto.sender.cnic,
        cityId: dto.sender.cityId,
        type: CustomerType.SENDER,
      });
      sender = await this.customerRepository.save(sender);
    } else {
      // Keep book-style customer info up to date when booking
      sender.name = dto.sender.name || sender.name;
      sender.address = dto.sender.address ?? sender.address;
      sender.cnic = dto.sender.cnic ?? sender.cnic;
      sender.cityId = dto.sender.cityId ?? sender.cityId;
      sender = await this.customerRepository.save(sender);
    }

    let receiver = await this.customerRepository.findOne({ where: { phone: dto.receiver.phone } });
    if (!receiver) {
      receiver = this.customerRepository.create({
        name: dto.receiver.name,
        phone: dto.receiver.phone,
        address: dto.receiver.address,
        cnic: dto.receiver.cnic,
        cityId: dto.receiver.cityId,
        type: CustomerType.RECEIVER,
      });
      receiver = await this.customerRepository.save(receiver);
    } else {
      receiver.name = dto.receiver.name || receiver.name;
      receiver.address = dto.receiver.address ?? receiver.address;
      receiver.cnic = dto.receiver.cnic ?? receiver.cnic;
      receiver.cityId = dto.receiver.cityId ?? receiver.cityId;
      receiver = await this.customerRepository.save(receiver);
    }

    const { 
      fare, 
      loading = 0, 
      unloading = 0, 
      labor = 0, 
      warehouse = 0, 
      misc = 0, 
      stTax = 0, 
      ttTax = 0,
      godown = 0,
      handling = 0,
      delivery = 0,
      adjustment = 0,
      previousBalance = 0
    } = dto.charges;
    
    const totalAmount = fare + loading + unloading + labor + warehouse + misc + stTax + ttTax + godown + handling + delivery + adjustment + previousBalance;

    const paidAmount = dto.payment?.paidAmount ?? 0;
    let paymentStatus: PaymentStatus;
    if (paidAmount >= totalAmount) {
      paymentStatus = PaymentStatus.PAID;
    } else if (paidAmount > 0) {
      paymentStatus = PaymentStatus.PARTIAL;
    } else {
      paymentStatus = PaymentStatus.TO_PAY;
    }
    const remainingAmount = totalAmount - paidAmount;

    const biltyNumber = await this.generateBiltyNumber();

    const consignment = this.consignmentRepository.create({
      biltyNumber,
      senderId: sender.id,
      receiverId: receiver.id,
      fromBranchId: dto.fromBranchId,
      toBranchId: dto.toBranchId,
      fromCityId: dto.fromCityId,
      toCityId: dto.toCityId,
      itemTypeId: dto.itemTypeId,
      quantity: dto.quantity,
      weight: dto.weight,
      goodsDescription: dto.goodsDescription,
      fare,
      loading,
      unloading,
      labor,
      warehouse,
      misc,
      stTax,
      ttTax,
      godown,
      handling,
      delivery,
      adjustment,
      previousBalance,
      totalAmount,
      paidAmount,
      remainingAmount,
      status: ConsignmentStatus.BOOKED,
      paymentStatus,
      createdById: userId,
    });

    const savedConsignment = await this.consignmentRepository.save(consignment);

    if (paidAmount > 0) {
      const payment = this.paymentRepository.create({
        consignmentId: savedConsignment.id,
        amount: paidAmount,
        type: PaymentType.BOOKING,
        method: (dto.payment?.method as PaymentMethod) || PaymentMethod.CASH,
      });
      await this.paymentRepository.save(payment);
    }

    return this.findOne(savedConsignment.id);
  }

  async update(id: string, dto: UpdateConsignmentDto, userId?: string): Promise<Consignment> {
    const consignment = await this.findOne(id);

    if (consignment.status !== ConsignmentStatus.BOOKED) {
      throw new ForbiddenException('Only BOOKED consignments can be edited');
    }

    if (dto.goodsDescription) {
      consignment.goodsDescription = dto.goodsDescription;
    }
    if (dto.quantity) {
      consignment.quantity = dto.quantity;
    }
    if (dto.weight !== undefined) {
      consignment.weight = dto.weight;
    }
    if (dto.fromCityId) {
      consignment.fromCityId = dto.fromCityId;
    }
    if (dto.toCityId) {
      consignment.toCityId = dto.toCityId;
    }
    if (dto.fromBranchId) {
      consignment.fromBranchId = dto.fromBranchId;
    }
    if (dto.toBranchId) {
      consignment.toBranchId = dto.toBranchId;
    }
    if (dto.itemTypeId !== undefined && dto.itemTypeId !== null) {
      consignment.itemTypeId = dto.itemTypeId;
    }

    if (dto.charges) {
      const { 
        fare, loading, unloading, labor, warehouse, misc, stTax, ttTax,
        godown, handling, delivery, adjustment, previousBalance 
      } = dto.charges;
      if (fare !== undefined) consignment.fare = fare;
      if (loading !== undefined) consignment.loading = loading;
      if (unloading !== undefined) consignment.unloading = unloading;
      if (labor !== undefined) consignment.labor = labor;
      if (warehouse !== undefined) consignment.warehouse = warehouse;
      if (misc !== undefined) consignment.misc = misc;
      if (stTax !== undefined) consignment.stTax = stTax;
      if (ttTax !== undefined) consignment.ttTax = ttTax;
      if (godown !== undefined) consignment.godown = godown;
      if (handling !== undefined) consignment.handling = handling;
      if (delivery !== undefined) consignment.delivery = delivery;
      if (adjustment !== undefined) consignment.adjustment = adjustment;
      if (previousBalance !== undefined) consignment.previousBalance = previousBalance;

      consignment.totalAmount =
        consignment.fare +
        consignment.loading +
        consignment.unloading +
        consignment.labor +
        consignment.warehouse +
        consignment.misc +
        consignment.stTax +
        consignment.ttTax +
        consignment.godown +
        consignment.handling +
        consignment.delivery +
        consignment.adjustment +
        consignment.previousBalance;
    }

    if (dto.payment?.paidAmount !== undefined) {
      consignment.paidAmount += dto.payment.paidAmount;
      consignment.remainingAmount = consignment.totalAmount - consignment.paidAmount;

      if (consignment.paidAmount >= consignment.totalAmount) {
        consignment.paymentStatus = PaymentStatus.PAID;
      } else if (consignment.paidAmount > 0) {
        consignment.paymentStatus = PaymentStatus.PARTIAL;
      }

      if (dto.payment.paidAmount > 0) {
        const payment = this.paymentRepository.create({
          consignmentId: consignment.id,
          amount: dto.payment.paidAmount,
          type: PaymentType.ADJUSTMENT,
          method: (dto.payment.method as PaymentMethod) || PaymentMethod.CASH,
        });
        await this.paymentRepository.save(payment);
      }
    }

    await this.consignmentRepository.save(consignment);
    return this.findOne(id);
  }

  async cancel(id: string): Promise<Consignment> {
    const consignment = await this.findOne(id);
    if (consignment.status === ConsignmentStatus.CANCELLED) {
      throw new BadRequestException('Consignment is already cancelled');
    }
    if (consignment.status === ConsignmentStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivered consignment');
    }
    consignment.status = ConsignmentStatus.CANCELLED;
    await this.consignmentRepository.save(consignment);
    return this.findOne(id);
  }

  async deliver(id: string, dto: DeliverConsignmentDto): Promise<Consignment> {
    const consignment = await this.findOne(id);

    if (consignment.status === ConsignmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot deliver cancelled consignment');
    }
    if (consignment.status === ConsignmentStatus.DELIVERED) {
      throw new BadRequestException('Consignment is already delivered');
    }

    const additionalWarehouse = dto.warehouse ?? 0;
    const additionalLabor = dto.labor ?? 0;
    const additionalMisc = dto.misc ?? 0;

    consignment.warehouse = Number(consignment.warehouse) + additionalWarehouse;
    consignment.labor = Number(consignment.labor) + additionalLabor;
    consignment.misc = Number(consignment.misc) + additionalMisc;

    consignment.totalAmount =
      Number(consignment.fare) +
      Number(consignment.loading) +
      Number(consignment.unloading) +
      Number(consignment.labor) +
      Number(consignment.warehouse) +
      Number(consignment.misc) +
      Number(consignment.stTax) +
      Number(consignment.ttTax);

    const additionalPaidAmount = dto.paidAmount ?? 0;
    consignment.paidAmount = Number(consignment.paidAmount) + additionalPaidAmount;
    consignment.remainingAmount = Number(consignment.totalAmount) - Number(consignment.paidAmount);

    if (consignment.remainingAmount <= 0) {
      consignment.paymentStatus = PaymentStatus.PAID;
    } else if (Number(consignment.paidAmount) > 0) {
      consignment.paymentStatus = PaymentStatus.PARTIAL;
    } else {
      consignment.paymentStatus = PaymentStatus.TO_PAY;
    }

    consignment.status = ConsignmentStatus.DELIVERED;
    consignment.deliveredAt = new Date();

    await this.consignmentRepository.save(consignment);

    if (additionalPaidAmount > 0) {
      const payment = this.paymentRepository.create({
        consignmentId: consignment.id,
        amount: additionalPaidAmount,
        type: PaymentType.DELIVERY,
        method: (dto.paymentMethod as PaymentMethod) || PaymentMethod.CASH,
      });
      await this.paymentRepository.save(payment);
    }

    return this.findOne(id);
  }

  async searchForDelivery(biltyNumber?: string, receiverPhone?: string): Promise<Consignment[]> {
    const queryBuilder = this.consignmentRepository
      .createQueryBuilder('consignment')
      .leftJoinAndSelect('consignment.sender', 'sender')
      .leftJoinAndSelect('consignment.receiver', 'receiver')
      .leftJoinAndSelect('consignment.fromBranch', 'fromBranch')
      .leftJoinAndSelect('consignment.toBranch', 'toBranch')
      .leftJoinAndSelect('consignment.fromCity', 'fromCity')
      .leftJoinAndSelect('consignment.toCity', 'toCity')
      .leftJoinAndSelect('consignment.itemType', 'itemType')
      .where('consignment.status IN (:...statuses)', { statuses: ['ARRIVED'] });

    if (biltyNumber) {
      queryBuilder.andWhere('consignment.biltyNumber LIKE :biltyNumber', { biltyNumber: `%${biltyNumber}%` });
    }

    if (receiverPhone) {
      queryBuilder.andWhere('receiver.phone LIKE :phone', { phone: `%${receiverPhone}%` });
    }

    return queryBuilder.getMany();
  }

  private async generateBiltyNumber(): Promise<string> {
    const date = new Date();
    const prefix = `CNS${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const count = await this.consignmentRepository.count({
      where: {
        biltyNumber: Like(`${prefix}%`),
      },
    });
    return `${prefix}${(count + 1).toString().padStart(4, '0')}`;
  }
}