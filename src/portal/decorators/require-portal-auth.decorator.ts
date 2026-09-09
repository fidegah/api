import { SetMetadata } from '@nestjs/common';

export const IS_PORTAL_AUTH_REQUIRED_KEY = 'isPortalAuthRequired';
export const RequirePortalAuth = () =>
  SetMetadata(IS_PORTAL_AUTH_REQUIRED_KEY, true);
