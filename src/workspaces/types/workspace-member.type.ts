import { WorkspaceUser } from '../../db/schema';

export type WorkspaceMember = Omit<WorkspaceUser, 'updatedAt'> & {
  fullName: string | null;
  avatarUrl: string | null;
  email: string;
  browserName: string | null;
  engineName: string | null;
  deviceModel: string | null;
  osName: string | null;
};
