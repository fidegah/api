import { Module } from '@nestjs/common';
import { PortalJwtAuthGuard } from './guards/portal-jwt-auth.guard';
import { PortalWorkspaceGuard } from './guards/portal-workspace.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [PortalJwtAuthGuard, PortalWorkspaceGuard],
  exports: [PortalJwtAuthGuard, PortalWorkspaceGuard],
})
export class PortalModule {}
