import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export enum ActivityFilter {
  ALL = 'all',
  POSTED = 'posted',
  VOTED = 'voted',
  COMMENTED = 'commented',
}

export class QueryUserActivityDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ActivityFilter)
  filter?: ActivityFilter;
}
