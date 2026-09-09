import { Module } from '@nestjs/common';
import { RoadmapsService } from './roadmaps.service';
import { RoadmapsController } from './roadmaps.controller';
import { RoadmapFactorsController } from './roadmap-factors.controller';
import { RoadmapItemsController } from './roadmap-items.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { RoadmapFactorsService } from './roadmap-factors.service';
import { RoadmapItemsService } from './roadmap-items.service';

@Module({
  imports: [WorkspacesModule],
  controllers: [
    RoadmapsController,
    RoadmapFactorsController,
    RoadmapItemsController,
  ],
  providers: [RoadmapsService, RoadmapFactorsService, RoadmapItemsService],
})
export class RoadmapsModule {}
