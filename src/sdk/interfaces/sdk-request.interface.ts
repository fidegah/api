import { Request } from 'express';
import type { Workspace } from '../../db/schema';

export interface SdkSessionContext {
  id: string;
  externalUserId: string;
}

export interface SdkSessionRequest extends Request {
  workspace?: Workspace;
  sdkSession?: SdkSessionContext;
}
