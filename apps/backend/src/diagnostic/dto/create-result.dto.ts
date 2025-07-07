import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString } from 'class-validator';

export class CreateResultDto {
  @IsString()
  title: string;

  @Type(() => Number)
  @IsInt()
  minScore: number;

  @Type(() => Number)
  @IsInt()
  maxScore: number;

  @IsString()
  message: string;
}
