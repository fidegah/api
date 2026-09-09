import { Workspace } from '../../db/schema';

export type PublicWorkspace = Omit<Workspace, 'secretKey'>;
