import { Controller, Post, Body, Res } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthenticationService } from '../authentication/authentication.service';

@Controller('users')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // on déstructure simplement email et password
    const { email, password } = loginDto;
    return this.authenticationService.login(email, password);
  }
}
