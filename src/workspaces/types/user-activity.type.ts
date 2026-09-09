export interface UserActivityPost {
  postId: string;
  title: string;
  description: string | null;
  votesCount: number;
  commentsCount: number;
  createdAt: string;
  hasPosted: boolean;
  hasVoted: boolean;
  hasCommented: boolean;
}

export interface ActivitySummary {
  totalPosts: number;
  postsCreated: number;
  votesGiven: number;
  commentsWritten: number;
}

export interface UserActivityStatus {
  posts: UserActivityPost[];
  summary: ActivitySummary;
}
