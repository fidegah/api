import { PollStatus } from '../dto/get-polls-query.dto';

export function getPollStatus(
  startAt: Date,
  endAt: Date,
  now: Date = new Date(),
): PollStatus {
  if (now < startAt) return 'not_started';
  if (now > endAt) return 'expired';
  return 'active';
}
