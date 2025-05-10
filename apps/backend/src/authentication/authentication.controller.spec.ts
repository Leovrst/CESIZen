import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from '../authentication/authentication.service';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let authService: Partial<AuthenticationService>;

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  describe('login', () => {
    const loginDto: LoginDto = { email: 'user@example.com', password: 'pass123' };

    it('should call authenticationService.login and return its result', async () => {
      const expected = { accessToken: 'token', user: { id: 1, email: loginDto.email } };
      (authService.login as jest.Mock).mockResolvedValue(expected);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(result).toEqual(expected);
    });

    it('should throw UnauthorizedException when authenticationService.login throws it', async () => {
      (authService.login as jest.Mock).mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
