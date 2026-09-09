import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateRoadmapItemDto {
  @IsString()
  @IsOptional()
  eta?: string;

  @IsOptional()
  @IsUUID()
  factorId?: string;

  @IsOptional()
  @IsInt()
  factorValue?: number;
}
