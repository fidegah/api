import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export enum PollStatusEnum {
  NOT_STARTED = 'not_started',
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

export type PollStatus = 'not_started' | 'active' | 'expired';

export class GetPollsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PollStatusEnum)
  status?: PollStatus;
}
