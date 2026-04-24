import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { RateType } from '../../../common/enums/status.enum';
import { City } from '../../cities/entities/city.entity';
import { ItemType } from '../../item-types/entities/item-type.entity';

@Entity('rate_lists')
@Index('idx_rate_from_to')
export class RateList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  fromCityId: string;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'fromCityId' })
  fromCity: City;

  @Column({ nullable: true })
  toCityId: string;

  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'toCityId' })
  toCity: City;

  @Column({ nullable: true })
  itemTypeId: string;

  @ManyToOne(() => ItemType, { nullable: true })
  @JoinColumn({ name: 'itemTypeId' })
  itemType: ItemType;

  @Column({ type: 'enum', enum: RateType, default: RateType.PER_ITEM })
  rateType: RateType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  rate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  defaultLabor: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  defaultLoading: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  defaultUnloading: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  defaultWarehouse: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}