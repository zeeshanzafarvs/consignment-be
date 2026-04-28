import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { ManifestStatus } from '../../../common/enums/status.enum';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { ManifestItem } from './manifest-item.entity';

@Entity('dispatch_manifests')
@Index('idx_manifest_number', ['manifestNumber'])
export class DispatchManifest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  manifestNumber: string;

  @Column({ nullable: true })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ nullable: true })
  driverId: string;

  @ManyToOne(() => Driver, { nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

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

  @Column({ type: 'enum', enum: ManifestStatus, default: ManifestStatus.CREATED })
  status: ManifestStatus;

  @Column({ nullable: true })
  departureTime: Date;

  @Column({ nullable: true })
  arrivalTime: Date;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany(() => ManifestItem, (item) => item.manifest)
  items: ManifestItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  profit?: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}