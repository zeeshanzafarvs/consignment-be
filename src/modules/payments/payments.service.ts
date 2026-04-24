import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentStatus } from '../../common/enums/status.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async findAll() {
    return this.paymentRepository.find({
      where: { isActive: true },
      relations: ['consignment'],
    });
  }

  async findOne(id: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id, isActive: true },
      relations: ['consignment'],
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async findByConsignment(consignmentId: string) {
    return this.paymentRepository.find({
      where: { consignmentId, isActive: true },
      relations: ['consignment'],
    });
  }

  async create(data: Partial<Payment>) {
    const payment = this.paymentRepository.create(data);
    return this.paymentRepository.save(payment);
  }

  async update(id: string, data: Partial<Payment>) {
    const payment = await this.findOne(id);
    Object.assign(payment, data);
    return this.paymentRepository.save(payment);
  }

  async updateStatus(id: string, status: PaymentStatus) {
    const payment = await this.findOne(id);
    payment.status = status;
    return this.paymentRepository.save(payment);
  }

  async remove(id: string) {
    const payment = await this.findOne(id);
    payment.isActive = false;
    return this.paymentRepository.save(payment);
  }
}