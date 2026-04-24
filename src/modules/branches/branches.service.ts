import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Branch } from './entities/branch.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  async findAll() {
    return this.branchRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const branch = await this.branchRepository.findOne({ where: { id, isActive: true } });
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
    return this.branchRepository.save(branch);
  }

  async remove(id: string) {
    const branch = await this.findOne(id);
    branch.isActive = false;
    return this.branchRepository.save(branch);
  }
}