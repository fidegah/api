import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class VotePollDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  optionIds!: string[];
}
