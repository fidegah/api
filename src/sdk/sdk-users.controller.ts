import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { SdkGuard } from './guards/sdk.guard';
import { SdkService } from './sdk.service';

interface SdkRequest extends Request {
  sdkSession: {
    id: string;
    workspaceId: string;
    externalUserId?: string | null;
  };
}

@Controller('sdk/users')
@UseGuards(SdkGuard)
export class SdkUsersController {
  constructor(private readonly sdkService: SdkService) {}

  @Get('me')
  async getMe(@Req() req: SdkRequest) {
    return this.sdkService.findExternalUserBySession(req.sdkSession.id);
  }
}
