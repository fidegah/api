import { Controller, Get, UseGuards } from '@nestjs/common';
import { SdkWorkspaceGuard } from './guards/sdk-workspace.guard';
import { SdkSessionGuard } from './guards/sdk-session.guard';
import { SdkService } from './sdk.service';
import type { SdkSessionContext } from './interfaces/sdk-request.interface';
import { CurrentSdkSession } from './decorators/sdk-session.decorator';

@Controller('sdk/users')
@UseGuards(SdkWorkspaceGuard, SdkSessionGuard)
export class SdkUsersController {
  constructor(private readonly sdkService: SdkService) {}

  @Get('me')
  getMe(@CurrentSdkSession() session: SdkSessionContext) {
    return this.sdkService.findExternalUserById(session.externalUserId);
  }
}
