import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { Subdomain } from '../common/decorators/subdomain.decorator';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { QueryUserActivityDto } from './dto/query-user-activity.dto';
import { QueryWorkspaceUsersDto } from './dto/query-workspace-users.dto';
import { UpdateAllowedDomainsDto } from './dto/update-allowed-domains.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceUsersService } from './workspace-users.service';
import { WorkspacesService } from './workspaces.service';

@Controller({ path: 'workspaces', version: VERSION_NEUTRAL })
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly workspaceUsersService: WorkspaceUsersService,
  ) {}

  @Post()
  create(@CurrentUserId() userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUserId() userId: string) {
    return this.workspacesService.findAllByUser(userId);
  }

  @Get('current')
  findCurrent(@CurrentUserId() userId: string, @Subdomain() subdomain: string) {
    return this.workspacesService.findBySubdomain(subdomain, userId);
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.findByWorkspaceId(id);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.updateByWorkspaceId(id, dto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.removeByWorkspaceId(id);
  }

  @Get(':id/credentials')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  getCredentials(@Param('id', ParseUUIDPipe) id: string) {
    return this.workspacesService.getCredentialsByWorkspaceId(id);
  }

  @Patch(':id/allowed-domains')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  updateAllowedDomains(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAllowedDomainsDto,
  ) {
    return this.workspacesService.updateAllowedDomainsByWorkspaceId(id, dto);
  }

  @Patch(':id/secure-identify')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner')
  toggleSecureIdentify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('enforce', ParseBoolPipe) enforce: boolean,
  ) {
    return this.workspacesService.toggleSecureIdentifyByWorkspaceId(
      id,
      enforce,
    );
  }

  @Get(':id/me')
  @UseGuards(WorkspaceRoleGuard)
  getMyMembership(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.workspaceUsersService.getMembership(id, userId);
  }

  // --- Internal Users Endpoints ---

  @Get(':id/users')
  @UseGuards(WorkspaceRoleGuard)
  findMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryWorkspaceUsersDto,
  ) {
    return this.workspaceUsersService.findAllByWorkspace(id, query);
  }

  @Get(':id/users/:userId')
  @UseGuards(WorkspaceRoleGuard)
  findMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.workspaceUsersService.findOneMember(id, userId);
  }

  @Delete(':id/users/:userId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.workspaceUsersService.removeUser(id, userId);
  }

  @Post(':id/users/:userId/ban')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  banMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.workspaceUsersService.banUser(id, userId);
  }

  @Delete(':id/users/:userId/ban')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  unbanMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.workspaceUsersService.unbanUser(id, userId);
  }

  @Get(':id/users/:userId/activity')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  getUserActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: QueryUserActivityDto,
  ) {
    return this.workspaceUsersService.getUserActivityStatus(id, userId, query);
  }

  // --- External Users Endpoints ---

  @Get(':id/external-users')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  findExternalMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QueryWorkspaceUsersDto,
  ) {
    return this.workspaceUsersService.findAllExternalByWorkspace(id, query);
  }

  @Get(':id/external-users/:externalUserId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  findExternalMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('externalUserId', ParseUUIDPipe) externalUserId: string,
  ) {
    return this.workspaceUsersService.findOneExternalMember(id, externalUserId);
  }

  @Delete(':id/external-users/:externalUserId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  removeExternalMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('externalUserId', ParseUUIDPipe) externalUserId: string,
  ) {
    return this.workspaceUsersService.removeExternalUser(id, externalUserId);
  }

  @Post(':id/external-users/:externalUserId/ban')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  banExternalMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('externalUserId', ParseUUIDPipe) externalUserId: string,
  ) {
    return this.workspaceUsersService.banExternalUser(id, externalUserId);
  }

  @Delete(':id/external-users/:externalUserId/ban')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  unbanExternalMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('externalUserId', ParseUUIDPipe) externalUserId: string,
  ) {
    return this.workspaceUsersService.unbanExternalUser(id, externalUserId);
  }

  @Get(':id/external-users/:externalUserId/activity')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  getExternalUserActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('externalUserId', ParseUUIDPipe) externalUserId: string,
    @Query() query: QueryUserActivityDto,
  ) {
    return this.workspaceUsersService.getExternalUserActivityStatus(
      id,
      externalUserId,
      query,
    );
  }
}
