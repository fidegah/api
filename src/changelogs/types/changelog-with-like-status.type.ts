import { Changelog } from '../../db/schema';

export type ChangelogWithLikeStatus = Changelog & { isLiked: boolean };
