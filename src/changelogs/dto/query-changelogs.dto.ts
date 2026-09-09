import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { transformToArray } from '../../common/utils/transform.util';

export class QueryChangelogsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(transformToArray)
  @IsArray()
  @IsUUID(undefined, { each: true })
  tagId?: string[];
}
