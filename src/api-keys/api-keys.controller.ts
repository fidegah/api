import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

@Controller('workspaces/:workspaceId/api-keys')
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @RequireRole('owner', 'admin')
  create(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(userId, workspaceId, createApiKeyDto);
  }

  @Get()
  @RequireRole('owner', 'admin')
  findAll(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.apiKeysService.findAll(workspaceId);
  }

  @Get(':id')
  @RequireRole('owner', 'admin')
  findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.apiKeysService.findOne(id, workspaceId);
  }

  @Patch(':id')
  @RequireRole('owner', 'admin')
  update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
  ) {
    return this.apiKeysService.update(id, workspaceId, updateApiKeyDto);
  }

  @Delete(':id')
  @RequireRole('owner', 'admin')
  revoke(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.apiKeysService.revoke(id, workspaceId);
  }
}
