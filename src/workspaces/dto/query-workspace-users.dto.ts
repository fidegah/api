import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryWorkspaceUsersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
