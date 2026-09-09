import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message:
      'Subdomain can only contain lowercase letters, numbers, and hyphens',
  })
  subdomain!: string;
}
