import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class DeviceInfoDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsOptional()
  browserName?: string;

  @IsString()
  @IsOptional()
  osName?: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;

  @IsString()
  @IsOptional()
  engineName?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsUrl()
  @IsOptional()
  currentUrl?: string;
}
