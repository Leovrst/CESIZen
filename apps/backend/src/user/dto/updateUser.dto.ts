import { IsEmail, IsOptional, IsString, MinLength, IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from 'src/entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  readonly firstName?: string;

  @IsOptional()
  @IsString()
  readonly lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: "L'email doit être valide." })
  readonly email?: string;

  @IsOptional()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  readonly password?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: "Le rôle doit être l'un des suivants: user, admin, superAdmin" })
  readonly role?: UserRole;

  @IsOptional()
  @IsBoolean()
  readonly suspended?: boolean;
}
