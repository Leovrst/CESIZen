import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateResultDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxScore?: number;

  @IsOptional()
  @IsString()
  message?: string;
}
