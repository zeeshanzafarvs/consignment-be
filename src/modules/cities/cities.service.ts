import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { City } from './entities/city.entity';

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class CitiesService {
  constructor(
    @InjectRepository(City)
    private cityRepository: Repository<City>,
  ) {}

  async findAll(params: PaginationParams): Promise<PaginatedResult<City>> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.cityRepository.createQueryBuilder('city');

    if (search) {
      queryBuilder.where('city.name ILIKE :search', { search: `%${search}%` });
    }

    queryBuilder.skip(skip).take(limit).orderBy('city.name', 'ASC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<City> {
    const city = await this.cityRepository.findOne({ where: { id } });
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return city;
  }

  async create(data: Partial<City>): Promise<City> {
    const existing = await this.cityRepository.findOne({ where: { name: data.name } });
    if (existing) {
      throw new BadRequestException('City with this name already exists');
    }
    const city = this.cityRepository.create(data);
    return this.cityRepository.save(city);
  }

  async update(id: string, data: Partial<City>): Promise<City> {
    const city = await this.findOne(id);
    if (data.name && data.name !== city.name) {
      const existing = await this.cityRepository.findOne({ where: { name: data.name } });
      if (existing) {
        throw new BadRequestException('City with this name already exists');
      }
    }
    Object.assign(city, data);
    return this.cityRepository.save(city);
  }

  async remove(id: string): Promise<void> {
    const city = await this.findOne(id);
    await this.cityRepository.remove(city);
  }
}