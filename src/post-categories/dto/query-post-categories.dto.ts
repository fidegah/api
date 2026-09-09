import { IsOptional, IsUUID } from 'class-validator';

export class QueryPostCategoriesDto {
  @IsOptional()
  @IsUUID()
  boardId?: string;
}
