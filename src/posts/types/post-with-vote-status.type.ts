import { Post } from '../../db/schema';

export interface PostCreator {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export type PostWithVoteStatus = Post & {
  isVoted: boolean;
  creator: PostCreator | null;
};
