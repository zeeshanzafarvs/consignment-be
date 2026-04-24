import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ExpenseType } from '../../../common/enums/status.enum';
import { Branch } from '../../branches/entities/branch.entity';
import { DispatchManifest } from '../../dispatch-manifests/entities/dispatch-manifest.entity';

@Entity('expenses')
@Index('idx_expense_branch', ['branchId'])
@Index('idx_expense_created_at', ['createdAt'])
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  branchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ nullable: true })
  manifestId: string;

  @ManyToOne(() => DispatchManifest, { nullable: true })
  @JoinColumn({ name: 'manifestId' })
  manifest: DispatchManifest;

  @Column({ type: 'enum', enum: ExpenseType })
  type: ExpenseType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}