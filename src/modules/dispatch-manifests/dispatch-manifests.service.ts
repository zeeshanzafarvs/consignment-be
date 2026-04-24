import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DispatchManifest } from './entities/dispatch-manifest.entity';
import { ManifestStatus } from '../../common/enums/status.enum';

@Injectable()
export class DispatchManifestsService {
  constructor(
    @InjectRepository(DispatchManifest)
    private manifestRepository: Repository<DispatchManifest>,
  ) {}

  async findAll() {
    return this.manifestRepository.find({
      where: { isActive: true },
      relations: ['vehicle', 'driver'],
    });
  }

  async findOne(id: string) {
    const manifest = await this.manifestRepository.findOne({
      where: { id, isActive: true },
      relations: ['vehicle', 'driver'],
    });
    if (!manifest) {
      throw new NotFoundException('Manifest not found');
    }
    return manifest;
  }

  async findByStatus(status: ManifestStatus) {
    return this.manifestRepository.find({
      where: { status, isActive: true },
      relations: ['vehicle', 'driver'],
    });
  }

  async create(data: Partial<DispatchManifest>) {
    const manifestNumber = await this.generateManifestNumber();
    const manifest = this.manifestRepository.create({
      ...data,
      manifestNumber,
    });
    return this.manifestRepository.save(manifest);
  }

  async update(id: string, data: Partial<DispatchManifest>) {
    const manifest = await this.findOne(id);
    Object.assign(manifest, data);
    return this.manifestRepository.save(manifest);
  }

  async updateStatus(id: string, status: ManifestStatus) {
    const manifest = await this.findOne(id);
    manifest.status = status;
    return this.manifestRepository.save(manifest);
  }

  async remove(id: string) {
    const manifest = await this.findOne(id);
    manifest.isActive = false;
    return this.manifestRepository.save(manifest);
  }

  private async generateManifestNumber(): Promise<string> {
    const date = new Date();
    const prefix = `MAN${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const count = await this.manifestRepository.count();
    return `${prefix}${(count + 1).toString().padStart(6, '0')}`;
  }
}