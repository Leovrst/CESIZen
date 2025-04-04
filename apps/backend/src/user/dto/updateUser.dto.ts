// backend/src/user/dto/update-user.dto.ts
import { IsEmail, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';

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
  @IsBoolean()
  readonly isAdmin?: boolean;
}
