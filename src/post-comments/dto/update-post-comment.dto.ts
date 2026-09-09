import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdatePostCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}
