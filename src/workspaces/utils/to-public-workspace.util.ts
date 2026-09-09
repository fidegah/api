import { Workspace } from '../../db/schema';
import { PublicWorkspace } from '../types/public-workspace.type';

export function toPublicWorkspace(workspace: Workspace): PublicWorkspace {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { secretKey, ...publicWorkspace } = workspace;
  return publicWorkspace;
}
