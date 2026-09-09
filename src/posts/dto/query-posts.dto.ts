import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { transformToArray } from '../../common/utils/transform.util';

export enum PostActivityStatus {
  ACTIVE = 'active',
  OLD = 'old',
}

export class QueryPostsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(transformToArray)
  @IsArray()
  @IsUUID(undefined, { each: true })
  boardId?: string[];

  @IsOptional()
  @Transform(transformToArray)
  @IsArray()
  @IsString({ each: true })
  statusValue?: string[];

  @IsOptional()
  @Transform(transformToArray)
  @IsArray()
  @IsString({ each: true })
  statusId?: string[];

  @IsOptional()
  @Transform(transformToArray)
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagId?: string[];

  @IsOptional()
  @IsEnum(PostActivityStatus)
  status?: PostActivityStatus;
}
