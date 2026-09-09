import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePostCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsUUID()
  boardId!: string;
}
