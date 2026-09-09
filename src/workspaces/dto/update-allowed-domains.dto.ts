import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class UpdateAllowedDomainsDto {
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  allowedDomains!: string[];
}
