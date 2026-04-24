import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './entities/city.entity';

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private cityRepository: Repository<City>,
  ) {}

  async findAll() {
    return this.cityRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const city = await this.cityRepository.findOne({ where: { id, isActive: true } });
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return city;
  }

  async create(data: Partial<City>) {
    const city = this.cityRepository.create(data);
    return this.cityRepository.save(city);
  }

  async update(id: string, data: Partial<City>) {
    const city = await this.findOne(id);
    Object.assign(city, data);
    return this.cityRepository.save(city);
  }

  async remove(id: string) {
    const city = await this.findOne(id);
    city.isActive = false;
    return this.cityRepository.save(city);
  }
}