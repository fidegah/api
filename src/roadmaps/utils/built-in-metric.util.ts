import { Post } from '../../db/schema';

export function getBuiltInMetricValue(metric: string, post: Post): number {
  switch (metric) {
    case 'votes':
      return post.votesCount;
    case 'comments':
      return post.commentsCount;
    case 'age': {
      const ageInDays =
        (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return Math.round(ageInDays);
    }
    default:
      return 0;
  }
}
