import { IsInt, IsString } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  label: string;

  @IsString()
  points: number;
}
