import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export enum FactorType {
  ZERO_TO_TEN = '0-10',
  ZERO_TO_HUNDRED = '0-100',
  STARS = 'stars',
  FIBONACCI = 'fibonacci',
  BOOLEAN = 'boolean',
}

export enum FactorSource {
  CUSTOM = 'custom',
  BUILT_IN = 'built_in',
}

export enum BuiltInMetric {
  VOTES = 'votes',
  COMMENTS = 'comments',
  AGE = 'age',
}

export class CreateRoadmapFactorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsEnum(FactorSource)
  source: FactorSource = FactorSource.CUSTOM;

  @ValidateIf(
    (createRoadmapFactorDto: CreateRoadmapFactorDto) =>
      createRoadmapFactorDto.source === FactorSource.CUSTOM,
  )
  @IsEnum(FactorType)
  type?: FactorType;

  @ValidateIf(
    (createRoadmapFactorDto: CreateRoadmapFactorDto) =>
      createRoadmapFactorDto.source === FactorSource.BUILT_IN,
  )
  @IsEnum(BuiltInMetric)
  metric?: BuiltInMetric;

  @IsNumber()
  weight!: number;

  @IsBoolean()
  isEffort!: boolean;
}
