import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../entities/user.entity';

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
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères.',
  })
  readonly password: string;

  @IsOptional()
  @IsBoolean()
  readonly suspended?: boolean;

  @IsOptional()
  @IsEnum(UserRole, {
    message: "Le rôle doit être l'un des suivants: user, admin, superAdmin",
  })
  readonly role?: UserRole;
}
