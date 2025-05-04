import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReactivationRequestDto {
  @IsNotEmpty({ message: "Le commentaire est requis." })
  @IsString()
  comment: string;
}
