import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../users/types/auth-user.type';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';

import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

@Controller('workspaces/:workspaceId/api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createApiKeyDto: CreateApiKeyDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.apiKeysService.create(user.id, workspaceId, createApiKeyDto);
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async findAll(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.apiKeysService.findAll(workspaceId);
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.apiKeysService.findOne(id, workspaceId);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
  ) {
    return this.apiKeysService.update(id, workspaceId, updateApiKeyDto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async revoke(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.apiKeysService.revoke(id, workspaceId);
  }
}
