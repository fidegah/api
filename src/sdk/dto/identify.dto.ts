import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

export class IdentifyUserDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}

export class IdentifyDto {
  @IsString()
  @IsNotEmpty()
  sdkToken!: string;

  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => IdentifyUserDto)
  user!: IdentifyUserDto;

  @IsString()
  @IsOptional()
  verificationToken?: string;
}
