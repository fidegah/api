import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const RequireRole = (...roles: ('owner' | 'admin' | 'contributor')[]) =>
  SetMetadata(ROLES_KEY, roles);
