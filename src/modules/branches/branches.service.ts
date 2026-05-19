import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { PaginationHelper, PaginatedResult } from '../../common/dtos/pagination.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  async findAll(page = 1, limit = 10, search?: string): Promise<PaginatedResult<Branch>> {
    const queryBuilder = this.branchRepository.createQueryBuilder('branch')
      .leftJoinAndSelect('branch.city', 'city')
      .where('branch.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(branch.name ILIKE :search OR city.name ILIKE :search OR branch.address ILIKE :search)',
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
    const branch = await this.branchRepository.findOne({ 
      where: { id, isActive: true },
      relations: ['city']
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async create(data: Partial<Branch>) {
    const branch = this.branchRepository.create(data);
    return this.branchRepository.save(branch);
  }

  async update(id: string, data: Partial<Branch>) {
    const branch = await this.findOne(id);
    Object.assign(branch, data);
    const updated = await this.branchRepository.save(branch);
    return this.findOne(id); // Reload with relations
  }

  async remove(id: string) {
    const branch = await this.findOne(id);
    branch.isActive = false;
    return this.branchRepository.save(branch);
  }
}