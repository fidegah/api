import {
  Post,
  RoadmapCustomFactor,
  RoadmapCustomFactorValue,
  RoadmapItem,
} from '../../db/schema';
import { getBuiltInMetricValue } from './built-in-metric.util';

export interface CalculatedRoadmapItem {
  id: string;
  postId: string;
  title: string;
  board: string;
  statusId: string | null;
  votes: number;
  eta: string | null;
  factorValues: Record<string, number>;
  score: number;
}

export function calculateRoadmapItemScore(
  item: RoadmapItem,
  post: Post & { boardTitle: string },
  factors: RoadmapCustomFactor[],
  customValues: RoadmapCustomFactorValue[],
): CalculatedRoadmapItem {
  let totalImpact = 0;
  let totalEffort = 0;
  const factorValues: Record<string, number> = {};

  for (const factor of factors) {
    let value: number;

    if (factor.source === 'built_in' && factor.metric) {
      value = getBuiltInMetricValue(factor.metric, post);
    } else {
      const stored = customValues.find((v) => v.factorId === factor.id);
      value = stored?.value ?? 0;
    }

    factorValues[factor.name] = value;

    const weighted = value * factor.weight;

    if (factor.isEffort) {
      totalEffort += weighted;
    } else {
      totalImpact += weighted;
    }
  }

  if (totalEffort === 0) totalEffort = 1;

  const score = Math.round((totalImpact / totalEffort) * 100 * 10) / 10;

  return {
    id: item.id,
    postId: post.id,
    title: post.title,
    board: post.boardTitle,
    statusId: post.statusId,
    votes: post.votesCount,
    eta: item.eta,
    factorValues,
    score,
  };
}
