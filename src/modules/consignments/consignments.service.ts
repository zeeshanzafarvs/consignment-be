import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Consignment } from './entities/consignment.entity';
import { ConsignmentStatus } from '../../common/enums/status.enum';

@Injectable()
export class ConsignmentsService {
  constructor(
    @InjectRepository(Consignment)
    private consignmentRepository: Repository<Consignment>,
  ) {}

  async findAll() {
    return this.consignmentRepository.find({
      where: { isActive: true },
      relations: ['customer', 'senderBranch', 'receiverBranch', 'itemType'],
    });
  }

  async findOne(id: string) {
    const consignment = await this.consignmentRepository.findOne({
      where: { id, isActive: true },
      relations: ['customer', 'senderBranch', 'receiverBranch', 'itemType'],
    });
    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }
    return consignment;
  }

  async findByCustomer(customerId: string) {
    return this.consignmentRepository.find({
      where: { customerId, isActive: true },
      relations: ['customer', 'senderBranch', 'receiverBranch', 'itemType'],
    });
  }

  async findByManifest(manifestId: string) {
    return this.consignmentRepository.find({
      where: { manifestId, isActive: true },
      relations: ['customer', 'senderBranch', 'receiverBranch', 'itemType'],
    });
  }

  async create(data: Partial<Consignment>) {
    const consignmentNo = await this.generateConsignmentNo();
    const consignment = this.consignmentRepository.create({
      ...data,
      consignmentNo,
    });
    return this.consignmentRepository.save(consignment);
  }

  async update(id: string, data: Partial<Consignment>) {
    const consignment = await this.findOne(id);
    Object.assign(consignment, data);
    return this.consignmentRepository.save(consignment);
  }

  async updateStatus(id: string, status: ConsignmentStatus) {
    const consignment = await this.findOne(id);
    consignment.status = status;
    return this.consignmentRepository.save(consignment);
  }

  async remove(id: string) {
    const consignment = await this.findOne(id);
    consignment.isActive = false;
    return this.consignmentRepository.save(consignment);
  }

  private async generateConsignmentNo(): Promise<string> {
    const date = new Date();
    const prefix = `CNS${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const count = await this.consignmentRepository.count();
    return `${prefix}${(count + 1).toString().padStart(6, '0')}`;
  }
}