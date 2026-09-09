import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum TimeRange {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

export class DashboardQueryDto {
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange: TimeRange = TimeRange.MONTHLY;
}

export class PopularItemsQueryDto extends DashboardQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit: number = 10;
}
