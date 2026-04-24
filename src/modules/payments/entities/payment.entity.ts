import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { PaymentType, PaymentMethod } from '../../../common/enums/status.enum';
import { Consignment } from '../../consignments/entities/consignment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('payments')
@Index('idx_payment_consignment', ['consignmentId'])
@Index('idx_payment_created_at', ['createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  consignmentId: string;

  @ManyToOne(() => Consignment)
  @JoinColumn({ name: 'consignmentId' })
  consignment: Consignment;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentType })
  type: PaymentType;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}