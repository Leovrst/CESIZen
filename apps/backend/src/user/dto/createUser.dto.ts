// backend/src/user/dto/create-user.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Le prénom est requis.' })
  @IsString()
  readonly firstName: string;

  @IsNotEmpty({ message: 'Le nom est requis.' })
  @IsString()
  readonly lastName: string;

  @IsNotEmpty({ message: "L'email est requis." })
  @IsEmail({}, { message: "L'email doit être valide." })
  readonly email: string;

  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  readonly password: string;
}
