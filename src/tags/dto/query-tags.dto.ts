import { IsOptional, IsUUID } from 'class-validator';

export class QueryTagsDto {
  @IsOptional()
  @IsUUID()
  boardId?: string;
}
