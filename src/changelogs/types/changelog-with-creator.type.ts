import { Changelog } from '../../db/schema';

export type ChangelogCreator = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type ChangelogWithCreator = Changelog & {
  creator: ChangelogCreator;
};
