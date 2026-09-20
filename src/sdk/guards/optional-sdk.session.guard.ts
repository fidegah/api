import { ExecutionContext, Injectable } from '@nestjs/common';
import { SdkSessionGuard } from './sdk-session.guard';

@Injectable()
export class OptionalSdkSessionGuard extends SdkSessionGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch {
      return true;
    }
  }
}
