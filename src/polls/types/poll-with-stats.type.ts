import { Poll, PollOption } from '../../db/schema';
import { PollStatus } from '../dto/get-polls-query.dto';

export interface PollOptionWithStats extends PollOption {
  percentage: number;
  isVoted: boolean;
  userRank: number | null;
}

export interface PollWithStats extends Poll {
  options: PollOptionWithStats[];
  totalVotes: number;
  isVoted: boolean;
  status: PollStatus;
}
