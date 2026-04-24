import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { DispatchManifest } from './dispatch-manifest.entity';
import { Consignment } from '../../consignments/entities/consignment.entity';

@Entity('manifest_items')
@Unique(['manifest', 'consignment'])
export class ManifestItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  manifestId: string;

  @ManyToOne(() => DispatchManifest)
  @JoinColumn({ name: 'manifestId' })
  manifest: DispatchManifest;

  @Column()
  consignmentId: string;

  @ManyToOne(() => Consignment)
  @JoinColumn({ name: 'consignmentId' })
  consignment: Consignment;

  @CreateDateColumn()
  createdAt: Date;
}