// src/auth/optional-jwt.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Si pas d’erreur et pas d’utilisateur, on ne throw pas : on renvoie null
  handleRequest(err, user, info) {
    return user ?? null;
  }
}
