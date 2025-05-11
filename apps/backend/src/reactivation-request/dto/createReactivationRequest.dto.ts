import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateReactivationRequestDto {
  @IsUUID()
  userId: string;

  @IsNotEmpty({ message: "Le commentaire est requis." })
  @IsString()
  comment: string;
}
