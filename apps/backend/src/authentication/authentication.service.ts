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

  async validateUser(email: string, password: string) {
    const user = await this.userService.findUserByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(email: string, password: string) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) throw new UnauthorizedException('Identifiants incorrects');

    if (user.suspended && user.suspensionReason === 'BRUTE_FORCE') {
      throw new UnauthorizedException('Votre compte est suspendu suite à trop de tentatives. Contactez le support.');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      await this.userService.incrementLoginAttempts(user.id);
      const updatedUser = await this.userService.findUserById(user.id);

      if (updatedUser.loginAttempts >= 5) {
        await this.userService.suspendUserAndCreateReactivationRequest(user.id);
        throw new UnauthorizedException('Trop de tentatives, compte suspendu. Contactez le support.');
      }

      throw new UnauthorizedException('Identifiants incorrects');
    }

    await this.userService.resetLoginAttempts(user.id);

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken, user };
  }
}
