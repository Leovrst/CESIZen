import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  points?: number;
}
