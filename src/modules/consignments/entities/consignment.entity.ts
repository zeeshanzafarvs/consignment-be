import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { ConsignmentStatus, PaymentStatus } from '../../../common/enums/status.enum';
import { Customer } from '../../customers/entities/customer.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { City } from '../../cities/entities/city.entity';
import { ItemType } from '../../item-types/entities/item-type.entity';
import { User } from '../../users/entities/user.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Entity('consignments')
@Index('idx_consignment_bilty', ['biltyNumber'])
@Index('idx_consignment_status', ['status'])
@Index('idx_consignment_payment_status', ['paymentStatus'])
@Index('idx_consignment_created_at', ['createdAt'])
@Index('idx_consignment_from_city', ['fromCityId'])
@Index('idx_consignment_to_city', ['toCityId'])
export class Consignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  biltyNumber: string;

  @Column()
  senderId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'senderId' })
  sender: Customer;

  @Column()
  receiverId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'receiverId' })
  receiver: Customer;

  @Column({ nullable: true })
  fromBranchId: string;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'fromBranchId' })
  fromBranch: Branch;

  @Column({ nullable: true })
  toBranchId: string;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'toBranchId' })
  toBranch: Branch;

  @Column()
  fromCityId: string;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'fromCityId' })
  fromCity: City;

  @Column()
  toCityId: string;

  @ManyToOne(() => City)
  @JoinColumn({ name: 'toCityId' })
  toCity: City;

  @Column({ nullable: true })
  itemTypeId: string;

  @ManyToOne(() => ItemType, { nullable: true })
  @JoinColumn({ name: 'itemTypeId' })
  itemType: ItemType;

  @Column({ type: 'enum', enum: ConsignmentStatus, default: ConsignmentStatus.BOOKED })
  status: ConsignmentStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.TO_PAY })
  paymentStatus: PaymentStatus;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'text' })
  goodsDescription: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fare: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  loading: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unloading: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  labor: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  warehouse: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  godown: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  handling: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  delivery: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  adjustment: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  misc: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'previousBalance' })
  biltyKharcha: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  stTax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  ttTax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  remainingAmount: number;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  deliveredAt: Date;

  @OneToMany(() => Payment, (payment) => payment.consignment)
  payments: Payment[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}