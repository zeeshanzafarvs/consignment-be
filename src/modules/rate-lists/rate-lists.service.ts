import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RateList } from './entities/rate-list.entity';

@Injectable()
export class RateListsService {
  constructor(
    @InjectRepository(RateList)
    private rateListRepository: Repository<RateList>,
  ) {}

  async findAll() {
    return this.rateListRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const rateList = await this.rateListRepository.findOne({ where: { id, isActive: true } });
    if (!rateList) {
      throw new NotFoundException('Rate list not found');
    }
    return rateList;
  }

  async findByRoute(fromCityId: string, toCityId: string, itemTypeId?: string) {
    const query = this.rateListRepository
      .createQueryBuilder('rate')
      .where('rate.fromCityId = :fromCityId', { fromCityId })
      .andWhere('rate.toCityId = :toCityId', { toCityId })
      .andWhere('rate.isActive = :isActive', { isActive: true });

    if (itemTypeId) {
      query.andWhere('rate.itemTypeId = :itemTypeId', { itemTypeId });
    }

    return query.getMany();
  }

  async create(data: Partial<RateList>) {
    const rateList = this.rateListRepository.create(data);
    return this.rateListRepository.save(rateList);
  }

  async update(id: string, data: Partial<RateList>) {
    const rateList = await this.findOne(id);
    Object.assign(rateList, data);
    return this.rateListRepository.save(rateList);
  }

  async remove(id: string) {
    const rateList = await this.findOne(id);
    rateList.isActive = false;
    return this.rateListRepository.save(rateList);
  }
}