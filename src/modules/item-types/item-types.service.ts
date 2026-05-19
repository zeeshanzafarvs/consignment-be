import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemType } from './entities/item-type.entity';
import { PaginationHelper, PaginatedResult } from '../../common/dtos/pagination.dto';

@Injectable()
export class ItemTypesService {
  constructor(
    @InjectRepository(ItemType)
    private itemTypeRepository: Repository<ItemType>,
  ) {}

  async findAll(page = 1, limit = 10, search?: string): Promise<PaginatedResult<ItemType>> {
    const queryBuilder = this.itemTypeRepository.createQueryBuilder('itemType')
      .where('itemType.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(itemType.name ILIKE :search OR itemType.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [items, total] = await queryBuilder
      .skip(PaginationHelper.getSkip(page, limit))
      .take(limit)
      .getManyAndCount();

    return PaginationHelper.paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const itemType = await this.itemTypeRepository.findOne({ where: { id, isActive: true } });
    if (!itemType) {
      throw new NotFoundException('Item type not found');
    }
    return itemType;
  }

  async create(data: Partial<ItemType>) {
    const itemType = this.itemTypeRepository.create(data);
    return this.itemTypeRepository.save(itemType);
  }

  async update(id: string, data: Partial<ItemType>) {
    const itemType = await this.findOne(id);
    Object.assign(itemType, data);
    return this.itemTypeRepository.save(itemType);
  }

  async remove(id: string) {
    const itemType = await this.findOne(id);
    itemType.isActive = false;
    return this.itemTypeRepository.save(itemType);
  }
}