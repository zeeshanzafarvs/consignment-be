import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  AfterLoad,
  AfterInsert,
  AfterUpdate,
} from 'typeorm';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  licenseNo?: string;

  /** API alias for `licenseNo` (not a DB column). */
  license?: string;

  @AfterLoad()
  @AfterInsert()
  @AfterUpdate()
  syncLicenseAlias() {
    this.license = this.licenseNo;
  }

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}