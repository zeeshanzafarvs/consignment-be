import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RateList } from './entities/rate-list.entity';
import { RateType } from '../../common/enums/status.enum';

export interface RateListFilters {
  fromCityId?: string;
  toCityId?: string;
  itemTypeId?: string;
  active?: boolean;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface CalculateFareDto {
  fromCityId: string;
  toCityId: string;
  itemTypeId: string;
  quantity: number;
  weight?: number;
}

export interface FareCalculation {
  fare: number;
  stTax: number;
  ttTax: number;
  totalAmount: number;
}

@Injectable()
export class RateListsService {
  constructor(
    @InjectRepository(RateList)
    private rateListRepository: Repository<RateList>,
  ) {}

  async findAll(
    filters: RateListFilters,
    pagination: PaginationParams,
  ): Promise<{ data: RateList[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page, limit } = pagination;
    const { fromCityId, toCityId, itemTypeId, active } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.rateListRepository
      .createQueryBuilder('rate')
      .leftJoinAndSelect('rate.fromCity', 'fromCity')
      .leftJoinAndSelect('rate.toCity', 'toCity')
      .leftJoinAndSelect('rate.itemType', 'itemType');

    if (fromCityId) {
      queryBuilder.andWhere('rate.fromCityId = :fromCityId', { fromCityId });
    }
    if (toCityId) {
      queryBuilder.andWhere('rate.toCityId = :toCityId', { toCityId });
    }
    if (itemTypeId) {
      queryBuilder.andWhere('rate.itemTypeId = :itemTypeId', { itemTypeId });
    }
    if (active !== undefined) {
      queryBuilder.andWhere('rate.active = :active', { active });
    }
    if (filters.search) {
      queryBuilder.andWhere(
        '(fromCity.name ILIKE :search OR toCity.name ILIKE :search OR itemType.name ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    queryBuilder.skip(skip).take(limit).orderBy('rate.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<RateList> {
    const rateList = await this.rateListRepository.findOne({
      where: { id },
      relations: ['fromCity', 'toCity', 'itemType'],
    });
    if (!rateList) {
      throw new NotFoundException('Rate list not found');
    }
    return rateList;
  }

  async create(data: Partial<RateList>): Promise<RateList> {
    const rateList = this.rateListRepository.create(data);
    return this.rateListRepository.save(rateList);
  }

  async update(id: string, data: Partial<RateList>): Promise<RateList> {
    const rateList = await this.findOne(id);
    Object.assign(rateList, data);
    return this.rateListRepository.save(rateList);
  }

  async remove(id: string): Promise<void> {
    const rateList = await this.findOne(id);
    rateList.active = false;
    await this.rateListRepository.save(rateList);
  }

  async calculate(params: CalculateFareDto): Promise<FareCalculation> {
    const { fromCityId, toCityId, itemTypeId, quantity, weight } = params;

    const rateList = await this.rateListRepository.findOne({
      where: [
        { fromCityId, toCityId, itemTypeId, active: true },
        { fromCityId: toCityId, toCityId: fromCityId, itemTypeId, active: true },
      ],
    });

    if (!rateList) {
      throw new NotFoundException('Rate list not found for the specified route');
    }

    if (!quantity || quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    let fare: number;
    let stTax: number;
    let ttTax: number;
    if (rateList.rateType === RateType.PER_ITEM) {
      fare = Number(rateList.rate) * quantity;
      stTax = Number(rateList.stTax || 0) * quantity;
      ttTax = Number(rateList.ttTax || 0) * quantity;
    } else {
      const weightValue = weight ?? 0;
      fare = Number(rateList.rate) * weightValue;
      stTax = Number(rateList.stTax || 0) * weightValue;
      ttTax = Number(rateList.ttTax || 0) * weightValue;
    }

    const totalAmount = fare + stTax + ttTax;

    return {
      fare,
      stTax,
      ttTax,
      totalAmount,
    };
  }
}