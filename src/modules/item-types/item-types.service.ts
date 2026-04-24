import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemType } from './entities/item-type.entity';

@Injectable()
export class ItemTypesService {
  constructor(
    @InjectRepository(ItemType)
    private itemTypeRepository: Repository<ItemType>,
  ) {}

  async findAll() {
    return this.itemTypeRepository.find({ where: { isActive: true } });
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