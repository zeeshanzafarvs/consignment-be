import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Like } from 'typeorm';
import { DispatchManifest } from './entities/dispatch-manifest.entity';
import { ManifestItem } from './entities/manifest-item.entity';
import { Consignment } from '../consignments/entities/consignment.entity';
import { ManifestStatus, ConsignmentStatus } from '../../common/enums/status.enum';
import { User } from '../users/entities/user.entity';

export interface ManifestFilters {
  status?: ManifestStatus;
  vehicleId?: string;
  driverId?: string;
  fromBranchId?: string;
  toBranchId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ManifestTotals {
  totalConsignments: number;
  totalQuantity: number;
  totalWeight: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  totalAmount: number;
}

export interface CreateManifestDto {
  vehicleId: string;
  driverId: string;
  fromBranchId: string;
  toBranchId: string;
  departureTime?: string;
}

export interface AddItemsDto {
  consignmentIds: string[];
}

@Injectable()
export class DispatchManifestsService {
  constructor(
    @InjectRepository(DispatchManifest)
    private manifestRepository: Repository<DispatchManifest>,
    @InjectRepository(ManifestItem)
    private manifestItemRepository: Repository<ManifestItem>,
    @InjectRepository(Consignment)
    private consignmentRepository: Repository<Consignment>,
  ) {}

  async findAll(
    filters: ManifestFilters,
    pagination: PaginationParams,
  ): Promise<{ data: DispatchManifest[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page, limit } = pagination;
    const { status, vehicleId, driverId, fromBranchId, toBranchId, dateFrom, dateTo } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.manifestRepository
      .createQueryBuilder('manifest')
      .leftJoinAndSelect('manifest.vehicle', 'vehicle')
      .leftJoinAndSelect('manifest.driver', 'driver')
      .leftJoinAndSelect('manifest.fromBranch', 'fromBranch')
      .leftJoinAndSelect('manifest.toBranch', 'toBranch')
      .leftJoinAndSelect('manifest.createdBy', 'createdBy');

    if (status) {
      queryBuilder.andWhere('manifest.status = :status', { status });
    }
    if (vehicleId) {
      queryBuilder.andWhere('manifest.vehicleId = :vehicleId', { vehicleId });
    }
    if (driverId) {
      queryBuilder.andWhere('manifest.driverId = :driverId', { driverId });
    }
    if (fromBranchId) {
      queryBuilder.andWhere('manifest.fromBranchId = :fromBranchId', { fromBranchId });
    }
    if (toBranchId) {
      queryBuilder.andWhere('manifest.toBranchId = :toBranchId', { toBranchId });
    }
    if (dateFrom) {
      queryBuilder.andWhere('manifest.createdAt >= :dateFrom', { dateFrom: new Date(dateFrom) });
    }
    if (dateTo) {
      queryBuilder.andWhere('manifest.createdAt <= :dateTo', { dateTo: new Date(dateTo) });
    }

    queryBuilder.skip(skip).take(limit).orderBy('manifest.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<DispatchManifest> {
    const manifest = await this.manifestRepository.findOne({
      where: { id },
      relations: ['vehicle', 'driver', 'fromBranch', 'toBranch', 'createdBy'],
    });
    if (!manifest) {
      throw new NotFoundException('Manifest not found');
    }
    return manifest;
  }

  async findOneWithItems(id: string): Promise<{ manifest: DispatchManifest; items: any[]; totals: ManifestTotals }> {
    const manifest = await this.findOne(id);

    const items = await this.manifestItemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.consignment', 'consignment')
      .leftJoinAndSelect('consignment.sender', 'sender')
      .leftJoinAndSelect('consignment.receiver', 'receiver')
      .leftJoinAndSelect('consignment.fromCity', 'fromCity')
      .leftJoinAndSelect('consignment.toCity', 'toCity')
      .where('item.manifestId = :manifestId', { manifestId: id })
      .getMany();

    const totals = this.calculateTotals(items);
    return { manifest, items, totals };
  }

  async findByConsignmentId(consignmentId: string): Promise<DispatchManifest | null> {
    const item = await this.manifestItemRepository.findOne({
      where: { consignmentId },
      relations: ['manifest', 'manifest.vehicle', 'manifest.driver', 'manifest.fromBranch', 'manifest.toBranch'],
    });
    return item?.manifest || null;
  }

  async create(dto: CreateManifestDto, userId?: string): Promise<DispatchManifest> {
    const manifestNumber = await this.generateManifestNumber();

    const manifest = this.manifestRepository.create({
      manifestNumber,
      vehicleId: dto.vehicleId,
      driverId: dto.driverId,
      fromBranchId: dto.fromBranchId,
      toBranchId: dto.toBranchId,
      departureTime: dto.departureTime ? new Date(dto.departureTime) : undefined,
      status: ManifestStatus.CREATED,
      createdById: userId,
    });

    return this.manifestRepository.save(manifest);
  }

  async addItems(manifestId: string, dto: AddItemsDto): Promise<ManifestItem[]> {
    const manifest = await this.findOne(manifestId);

    if (manifest.status !== ManifestStatus.CREATED) {
      throw new ForbiddenException('Cannot add items - manifest is not in CREATED status');
    }

    const items: ManifestItem[] = [];
    for (const consignmentId of dto.consignmentIds) {
      const consignment = await this.consignmentRepository.findOne({ where: { id: consignmentId } });
      if (!consignment) {
        throw new NotFoundException(`Consignment ${consignmentId} not found`);
      }
      if (consignment.status !== ConsignmentStatus.BOOKED) {
        throw new BadRequestException(`Consignment ${consignmentId} is not in BOOKED status`);
      }
      if (consignment.fromBranchId !== manifest.fromBranchId) {
        throw new BadRequestException(`Consignment ${consignmentId} does not belong to the same from branch`);
      }

      const existingInManifest = await this.manifestItemRepository.findOne({
        where: { manifestId, consignmentId },
      });
      if (existingInManifest) {
        throw new BadRequestException(`Consignment ${consignmentId} is already in this manifest`);
      }

      const inOtherActiveManifest = await this.manifestItemRepository
        .createQueryBuilder('item')
        .innerJoin('item.manifest', 'manifest')
        .where('item.consignmentId = :consignmentId', { consignmentId })
        .andWhere('manifest.status = :status', { status: ManifestStatus.CREATED })
        .getOne();
      if (inOtherActiveManifest) {
        throw new BadRequestException(`Consignment ${consignmentId} is already in another active manifest`);
      }

      const item = this.manifestItemRepository.create({
        manifestId,
        consignmentId,
      });
      items.push(await this.manifestItemRepository.save(item));
    }

    return items;
  }

  async removeItem(manifestId: string, itemId: string): Promise<void> {
    const manifest = await this.findOne(manifestId);
    if (manifest.status !== ManifestStatus.CREATED) {
      throw new ForbiddenException('Cannot remove items - manifest is not in CREATED status');
    }

    const item = await this.manifestItemRepository.findOne({ where: { id: itemId, manifestId } });
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    await this.manifestItemRepository.remove(item);
  }

  async dispatch(manifestId: string): Promise<DispatchManifest> {
    const manifest = await this.findOne(manifestId);

    if (!manifest.vehicleId || !manifest.driverId) {
      throw new BadRequestException('Vehicle and driver are required');
    }

    if (manifest.status !== ManifestStatus.CREATED) {
      throw new ForbiddenException('Cannot dispatch - manifest is not in CREATED status');
    }

    if (!manifest.departureTime) {
      manifest.departureTime = new Date();
    }

    manifest.status = ManifestStatus.DISPATCHED;
    await this.manifestRepository.save(manifest);

    const items = await this.manifestItemRepository.find({ where: { manifestId } });
    for (const item of items) {
      await this.consignmentRepository.update(item.consignmentId, { status: ConsignmentStatus.IN_TRANSIT });
    }

    return this.findOne(manifestId);
  }

  async arrive(manifestId: string): Promise<DispatchManifest> {
    const manifest = await this.findOne(manifestId);

    if (manifest.status !== ManifestStatus.DISPATCHED) {
      throw new ForbiddenException('Cannot arrive - manifest is not in DISPATCHED status');
    }

    manifest.status = ManifestStatus.ARRIVED;
    manifest.arrivalTime = new Date();
    await this.manifestRepository.save(manifest);

    const items = await this.manifestItemRepository.find({ where: { manifestId } });
    for (const item of items) {
      await this.consignmentRepository.update(item.consignmentId, { status: ConsignmentStatus.ARRIVED });
    }

    return this.findOne(manifestId);
  }

  async close(manifestId: string): Promise<DispatchManifest> {
    const manifest = await this.findOne(manifestId);

    if (manifest.status !== ManifestStatus.ARRIVED) {
      throw new ForbiddenException('Cannot close - manifest is not in ARRIVED status');
    }

    manifest.status = ManifestStatus.CLOSED;
    await this.manifestRepository.save(manifest);

    return this.findOne(manifestId);
  }

  private async generateManifestNumber(): Promise<string> {
    const date = new Date();
    const prefix = `MAN${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const count = await this.manifestRepository.count({
      where: {
        manifestNumber: Like(`${prefix}%`),
      },
    });
    return `${prefix}${(count + 1).toString().padStart(4, '0')}`;
  }

  private calculateTotals(items: any[]): ManifestTotals {
    let totalConsignments = 0;
    let totalQuantity = 0;
    let totalWeight = 0;
    let totalPaidAmount = 0;
    let totalRemainingAmount = 0;
    let totalAmount = 0;

    for (const item of items) {
      if (item.consignment) {
        totalConsignments++;
        totalQuantity += Number(item.consignment.quantity || 0);
        totalWeight += Number(item.consignment.weight || 0);
        totalPaidAmount += Number(item.consignment.paidAmount || 0);
        totalRemainingAmount += Number(item.consignment.remainingAmount || 0);
        totalAmount += Number(item.consignment.totalAmount || 0);
      }
    }

    return {
      totalConsignments,
      totalQuantity,
      totalWeight,
      totalPaidAmount,
      totalRemainingAmount,
      totalAmount,
    };
  }
}