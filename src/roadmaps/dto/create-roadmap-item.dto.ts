import { IsUUID } from 'class-validator';

export class CreateRoadmapItemDto {
  @IsUUID()
  postId!: string;
}
