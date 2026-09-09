import { Module } from '@nestjs/common';
import { SdkService } from './sdk.service';
import { SdkController } from './sdk.controller';
import { SdkUsersController } from './sdk-users.controller';

@Module({
  controllers: [SdkController, SdkUsersController],
  providers: [SdkService],
})
export class SdkModule {}
