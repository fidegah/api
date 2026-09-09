import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IdentifyDto } from './dto/identify.dto';
import { InitSessionDto } from './dto/init-session.dto';
import { SdkService } from './sdk.service';
import { SdkGuard } from './guards/sdk.guard';

@UseGuards(SdkGuard)
@Controller({ path: 'sdk', version: '1' })
export class SdkController {
  constructor(private readonly sdkService: SdkService) {}

  @Post('init-session')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  initSession(@Body() dto: InitSessionDto) {
    return this.sdkService.initSession(dto);
  }

  @Post('identify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  identify(@Body() dto: IdentifyDto) {
    return this.sdkService.identify(dto);
  }
}
