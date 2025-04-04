// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthenticationService } from '../authentication/authentication.service';

@Controller('users')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authenticationService.login(body.email, body.password);
  }
}
