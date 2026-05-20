import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Discount } from './entities/discount.entity';
import { DiscountStatus, DiscountApplyTo } from '../../common/enums/status.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export interface CreateDiscountDto {
  customerId: string;
  discountPercentage: number;
  applyTo: DiscountApplyTo;
}

export interface UpdateDiscountDto {
  customerId?: string;
  discountPercentage?: number;
  applyTo?: DiscountApplyTo;
}

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(Discount)
    private discountRepository: Repository<Discount>,
  ) {}

  async findAll(page = 1, limit = 10, search?: string): Promise<{ items: Discount[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.discountRepository
      .createQueryBuilder('discount')
      .leftJoinAndSelect('discount.customer', 'customer')
      .leftJoinAndSelect('discount.createdBy', 'createdBy')
      .leftJoinAndSelect('discount.approvedBy', 'approvedBy')
      .where('discount.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(customer.name ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.skip(skip).take(limit).orderBy('discount.createdAt', 'DESC');

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllActive(): Promise<Discount[]> {
    return this.discountRepository.find({
      where: { isActive: true, status: DiscountStatus.APPROVED },
      relations: ['customer', 'createdBy', 'approvedBy'],
    });
  }

  async findOne(id: string): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { id },
      relations: ['customer', 'createdBy', 'approvedBy'],
    });
    if (!discount) {
      throw new NotFoundException('Discount not found');
    }
    return discount;
  }

  async findApprovedByCustomerId(customerId: string): Promise<Discount | null> {
    return this.discountRepository.findOne({
      where: {
        customerId,
        isActive: true,
        status: DiscountStatus.APPROVED,
      },
      relations: ['customer'],
    });
  }

  async findActiveByCustomerId(customerId: string): Promise<Discount | null> {
    return this.discountRepository.findOne({
      where: {
        customerId,
        isActive: true,
      },
      relations: ['customer', 'createdBy', 'approvedBy'],
    });
  }

  async createOrUpdate(dto: CreateDiscountDto, userId: string, userRole: UserRole): Promise<Discount> {
    if (dto.discountPercentage > 20) {
      throw new BadRequestException('Discount percentage cannot exceed 20%');
    }

    if (dto.discountPercentage <= 0) {
      throw new BadRequestException('Discount percentage must be greater than 0');
    }

    const existing = await this.discountRepository.findOne({
      where: { customerId: dto.customerId, isActive: true },
    });

    if (existing) {
      existing.discountPercentage = dto.discountPercentage;
      existing.applyTo = dto.applyTo;
      existing.status = userRole === UserRole.ADMIN ? DiscountStatus.APPROVED : DiscountStatus.PENDING;
      existing.approvedById = userRole === UserRole.ADMIN ? userId : null;
      existing.approvedAt = userRole === UserRole.ADMIN ? new Date() : null;
      return this.discountRepository.save(existing);
    }

    const discount = new Discount();
    discount.customerId = dto.customerId;
    discount.discountPercentage = dto.discountPercentage;
    discount.applyTo = dto.applyTo;
    discount.status = userRole === UserRole.ADMIN ? DiscountStatus.APPROVED : DiscountStatus.PENDING;
    discount.createdById = userId;
    if (userRole === UserRole.ADMIN) {
      discount.approvedById = userId;
      discount.approvedAt = new Date();
    }

    return this.discountRepository.save(discount);
  }

  async update(id: string, dto: UpdateDiscountDto): Promise<Discount> {
    const discount = await this.findOne(id);

    if (dto.discountPercentage !== undefined) {
      if (dto.discountPercentage > 20) {
        throw new BadRequestException('Discount percentage cannot exceed 20%');
      }
      if (dto.discountPercentage <= 0) {
        throw new BadRequestException('Discount percentage must be greater than 0');
      }
      discount.discountPercentage = dto.discountPercentage;
    }

    if (dto.customerId !== undefined) {
      discount.customerId = dto.customerId;
    }

    if (dto.applyTo !== undefined) {
      discount.applyTo = dto.applyTo;
    }

    return this.discountRepository.save(discount);
  }

  async approve(id: string, userId: string): Promise<Discount> {
    const discount = await this.findOne(id);

    if (discount.status !== DiscountStatus.PENDING) {
      throw new BadRequestException('Discount is not in PENDING status');
    }

    discount.status = DiscountStatus.APPROVED;
    discount.approvedById = userId;
    discount.approvedAt = new Date();

    return this.discountRepository.save(discount);
  }

  async reject(id: string, userId: string): Promise<Discount> {
    const discount = await this.findOne(id);

    if (discount.status !== DiscountStatus.PENDING) {
      throw new BadRequestException('Discount is not in PENDING status');
    }

    discount.status = DiscountStatus.REJECTED;
    discount.approvedById = userId;
    discount.approvedAt = new Date();

    return this.discountRepository.save(discount);
  }

  async remove(id: string): Promise<void> {
    const discount = await this.findOne(id);
    discount.isActive = false;
    await this.discountRepository.save(discount);
  }
}
