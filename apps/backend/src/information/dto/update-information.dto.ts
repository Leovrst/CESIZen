import { PartialType } from '@nestjs/mapped-types';
import { CreateInformationPageDto } from './create-information-page.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateInformationPageDto extends PartialType(
  CreateInformationPageDto,
) {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  removeImage?: boolean;
}
