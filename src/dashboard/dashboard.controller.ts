import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';

import { DashboardService } from './dashboard.service';
import {
  DashboardQueryDto,
  PopularItemsQueryDto,
} from './dto/dashboard-query.dto';

@Controller({
  path: 'workspaces/:workspaceId/dashboard',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('activity-overview')
  @UseGuards(WorkspaceRoleGuard)
  async getActivityOverview(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getActivityOverview(workspaceId, query);
  }

  @Get('health-score')
  @UseGuards(WorkspaceRoleGuard)
  async getHealthScore(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getHealthScore(workspaceId, query);
  }

  @Get('popular-items')
  @UseGuards(WorkspaceRoleGuard)
  async getPopularItems(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: PopularItemsQueryDto,
  ) {
    return this.dashboardService.getPopularItems(workspaceId, query);
  }
}
