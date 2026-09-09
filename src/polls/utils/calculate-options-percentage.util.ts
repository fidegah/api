import { PollOption } from '../../db/schema';

export function calculateOptionsPercentage(
  options: PollOption[],
): (PollOption & { percentage: number })[] {
  const totalVotes = options.reduce((sum, opt) => sum + opt.votesCount, 0);

  return options.map((option) => ({
    ...option,
    percentage:
      totalVotes > 0
        ? Math.round((option.votesCount / totalVotes) * 10000) / 100
        : 0,
  }));
}
