// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // Méthode pour valider l'utilisateur en comparant le mot de passe
  async validateUser(email: string, password: string) {
    const user = await this.userService.findUserByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user; // Exclure le mot de passe
      return result;
    }
    return null;
  }

  // Méthode de login qui renvoie un token JWT et l'objet utilisateur (sans mot de passe)
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }
    // Définir le payload à partir de l'utilisateur
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      token: this.jwtService.sign(payload),
      user,
    };
  }
}
