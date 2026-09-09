import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  count,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  SQL,
  sql,
} from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { Poll, PollOption, polls, pollOptions, pollVotes } from '../db/schema';
import { CreatePollDto } from './dto/create-poll.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { buildPagination } from '../common/utils/build-pagination.util';
import { PaginatedResult } from '../common/types/pagination.type';
import { calculateOptionsPercentage } from './utils/calculate-options-percentage.util';
import { getPollStatus } from './utils/poll-status.util';
import { PollWithStats } from './types/poll-with-stats.type';
import { GetPollsQueryDto } from './dto/get-polls-query.dto';

@Injectable()
export class PollsService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  // Create

  async create(
    workspaceId: string,
    userId: string,
    createPollDto: CreatePollDto,
  ): Promise<PollWithStats> {
    const [poll] = await this.db
      .insert(polls)
      .values({
        workspaceId,
        userId,
        title: createPollDto.title,
        description: createPollDto.description,
        startAt: new Date(createPollDto.startAt),
        endAt: new Date(createPollDto.endAt),
        type: createPollDto.type,
      })
      .returning();

    const optionsValues = createPollDto.options.map((option, index) => ({
      pollId: poll.id,
      title: option.title,
      order: option.order ?? index,
    }));

    const createdOptions = await this.db
      .insert(pollOptions)
      .values(optionsValues)
      .returning();

    return this.attachStats(poll, createdOptions, null);
  }

  // Read

  async findAll(
    workspaceId: string,
    userId: string | null,
    query: GetPollsQueryDto,
  ): Promise<PaginatedResult<PollWithStats>> {
    const { page, limit, offset, search, status } = query;
    const now = new Date();

    const conditions: SQL[] = [eq(polls.workspaceId, workspaceId)];

    if (search?.trim()) {
      conditions.push(ilike(polls.title, `%${search.trim()}%`));
    }

    if (status === 'not_started') {
      conditions.push(gt(polls.startAt, now));
    } else if (status === 'expired') {
      conditions.push(lt(polls.endAt, now));
    } else if (status === 'active') {
      conditions.push(lte(polls.startAt, now));
      conditions.push(gte(polls.endAt, now));
    }

    const where = and(...conditions);

    const [pollsList, [{ total }]] = await Promise.all([
      this.db.query.polls.findMany({
        where,
        orderBy: (pollsTable, { desc }) => [desc(pollsTable.createdAt)],
        limit,
        offset,
      }),
      this.db.select({ total: count() }).from(polls).where(where),
    ]);

    const data = await this.attachStatsToMany(pollsList, userId);

    return { data, pagination: buildPagination(page, limit, total) };
  }

  async findOne(
    id: string,
    workspaceId: string,
    userId: string | null,
  ): Promise<PollWithStats> {
    const poll = await this.findPollOrThrow(id, workspaceId);

    const options = await this.db.query.pollOptions.findMany({
      where: eq(pollOptions.pollId, id),
      orderBy: (opts, { asc }) => [asc(opts.order)],
    });

    return this.attachStats(poll, options, userId);
  }

  // Delete

  async remove(id: string, workspaceId: string): Promise<{ message: string }> {
    await this.findPollOrThrow(id, workspaceId);

    await this.db.delete(polls).where(eq(polls.id, id));

    return { message: 'Poll deleted successfully' };
  }

  // Vote

  async vote(
    pollId: string,
    workspaceId: string,
    userId: string,
    votePollDto: VotePollDto,
  ): Promise<{ message: string }> {
    const poll = await this.findPollOrThrow(pollId, workspaceId);
    this.assertPollIsActive(poll);
    this.assertValidVoteShape(poll, votePollDto.optionIds);

    const validOptions = await this.db.query.pollOptions.findMany({
      where: and(
        eq(pollOptions.pollId, pollId),
        inArray(pollOptions.id, votePollDto.optionIds),
      ),
    });

    if (validOptions.length !== votePollDto.optionIds.length) {
      throw new BadRequestException(
        'One or more options do not belong to this poll',
      );
    }

    await this.replaceUserVotes(pollId, userId, votePollDto.optionIds);

    return { message: 'Vote has been successfully submitted' };
  }

  async removeVote(
    pollId: string,
    workspaceId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const poll = await this.findPollOrThrow(pollId, workspaceId);
    this.assertPollIsActive(poll);

    await this.replaceUserVotes(pollId, userId, []);

    return { message: 'Poll vote deleted successfully' };
  }

  // Private helpers

  private async findPollOrThrow(
    id: string,
    workspaceId: string,
  ): Promise<Poll> {
    const poll = await this.db.query.polls.findFirst({
      where: and(eq(polls.id, id), eq(polls.workspaceId, workspaceId)),
    });

    if (!poll) {
      throw new NotFoundException('Poll not found in this workspace');
    }

    return poll;
  }

  private assertPollIsActive(poll: Poll): void {
    const now = new Date();
    if (now < poll.startAt || now > poll.endAt) {
      throw new BadRequestException('This poll is not currently active');
    }
  }

  private assertValidVoteShape(poll: Poll, optionIds: string[]): void {
    if (poll.type === 'single' && optionIds.length !== 1) {
      throw new BadRequestException('This poll allows only a single choice');
    }
  }

  private async replaceUserVotes(
    pollId: string,
    userId: string,
    newOptionIds: string[],
  ): Promise<void> {
    const optionsOfThisPoll = await this.db.query.pollOptions.findMany({
      where: eq(pollOptions.pollId, pollId),
      columns: { id: true },
    });
    const optionIdsOfPoll = optionsOfThisPoll.map((o) => o.id);

    if (optionIdsOfPoll.length === 0) return;

    const previousVotes = await this.db.query.pollVotes.findMany({
      where: and(
        eq(pollVotes.userId, userId),
        inArray(pollVotes.optionId, optionIdsOfPoll),
      ),
      columns: { optionId: true },
    });

    if (previousVotes.length > 0) {
      await this.db
        .delete(pollVotes)
        .where(
          and(
            eq(pollVotes.userId, userId),
            inArray(pollVotes.optionId, optionIdsOfPoll),
          ),
        );

      for (const vote of previousVotes) {
        await this.db
          .update(pollOptions)
          .set({ votesCount: sql`${pollOptions.votesCount} - 1` })
          .where(eq(pollOptions.id, vote.optionId));
      }
    }

    if (newOptionIds.length > 0) {
      const voteRows = newOptionIds.map((optionId, index) => ({
        pollId,
        userId,
        optionId,
        rank: index + 1,
      }));

      await this.db.insert(pollVotes).values(voteRows);

      for (const optionId of newOptionIds) {
        await this.db
          .update(pollOptions)
          .set({ votesCount: sql`${pollOptions.votesCount} + 1` })
          .where(eq(pollOptions.id, optionId));
      }
    }
  }

  private async attachStats(
    poll: Poll,
    options: PollOption[],
    userId: string | null,
  ): Promise<PollWithStats> {
    const [withStats] = await this.attachStatsToMany([poll], userId, {
      [poll.id]: options,
    });
    return withStats;
  }

  private async attachStatsToMany(
    pollsList: Poll[],
    userId: string | null,
    preloadedOptions?: Record<string, PollOption[]>,
  ): Promise<PollWithStats[]> {
    if (pollsList.length === 0) return [];

    const pollIds = pollsList.map((p) => p.id);
    const optionsByPoll =
      preloadedOptions ?? (await this.groupOptionsByPoll(pollIds));

    let votedOptionRanks = new Map<string, number>();

    if (userId) {
      const allOptionIds = Object.values(optionsByPoll)
        .flat()
        .map((o) => o.id);

      if (allOptionIds.length > 0) {
        const userVotes = await this.db.query.pollVotes.findMany({
          where: and(
            eq(pollVotes.userId, userId),
            inArray(pollVotes.optionId, allOptionIds),
          ),
          columns: { optionId: true, rank: true },
        });

        votedOptionRanks = new Map(userVotes.map((v) => [v.optionId, v.rank]));
      }
    }

    const now = new Date();

    return pollsList.map((poll) => {
      const options = optionsByPoll[poll.id] ?? [];
      const optionsWithPercentage = calculateOptionsPercentage(options);

      const optionsWithVoteStatus = optionsWithPercentage.map((option) => ({
        ...option,
        isVoted: votedOptionRanks.has(option.id),
        userRank: votedOptionRanks.get(option.id) ?? null,
      }));

      const totalVotes = optionsWithVoteStatus.reduce(
        (sum, opt) => sum + opt.votesCount,
        0,
      );

      return {
        ...poll,
        options: optionsWithVoteStatus,
        totalVotes,
        isVoted: optionsWithVoteStatus.some((opt) => opt.isVoted),
        status: getPollStatus(poll.startAt, poll.endAt, now),
      };
    });
  }

  private async groupOptionsByPoll(
    pollIds: string[],
  ): Promise<Record<string, PollOption[]>> {
    const allOptions = await this.db.query.pollOptions.findMany({
      where: inArray(pollOptions.pollId, pollIds),
      orderBy: (opts, { asc }) => [asc(opts.order)],
    });

    const grouped: Record<string, PollOption[]> = {};
    for (const option of allOptions) {
      if (!grouped[option.pollId]) grouped[option.pollId] = [];
      grouped[option.pollId].push(option);
    }

    return grouped;
  }
}
