import { PostComment } from '../../db/schema';

export type CommentCreator = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type CommentWithLikeStatus = PostComment & {
  isLiked: boolean;
};

export type CommentWithDetails = CommentWithLikeStatus & {
  creator: CommentCreator | null;
};
