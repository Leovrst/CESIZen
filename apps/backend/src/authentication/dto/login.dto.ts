import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: "L'email doit être valide." })
  readonly email: string;

  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  readonly password: string;
}
