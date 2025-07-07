import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateInformationPageDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}
