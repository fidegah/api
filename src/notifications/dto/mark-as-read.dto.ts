import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class MarkAsReadDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  notificationIds!: string[];
}
