import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispatchManifest } from './entities/dispatch-manifest.entity';
import { DispatchManifestsService } from './dispatch-manifests.service';
import { DispatchManifestsController } from './dispatch-manifests.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DispatchManifest])],
  controllers: [DispatchManifestsController],
  providers: [DispatchManifestsService],
  exports: [DispatchManifestsService],
})
export class DispatchManifestsModule {}