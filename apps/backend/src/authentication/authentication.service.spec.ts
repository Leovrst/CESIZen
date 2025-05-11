import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthenticationService } from './authentication.service';
import { UserService } from '../user/user.service';

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let userService: Partial<UserService>;
  let jwtService: Partial<JwtService>;

  beforeEach(() => {
    userService = {
      findUserByEmail: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signedToken'),
    };
    authService = new AuthenticationService(
      userService as any,
      jwtService as any,
    );
  });

  describe('validateUser', () => {
    it('should return user data without password when credentials are valid', async () => {
      const mockUser: any = { id: 1, email: 'test@example.com', password: 'hashedPwd', role: 'user' };
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateUser('test@example.com', 'plainPwd');

      expect(result).toEqual({ id: 1, email: 'test@example.com', role: 'user' });
      expect(userService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null if user not found', async () => {
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(null);
      const result = await authService.validateUser('notfound@example.com', 'any');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const mockUser: any = { id: 2, email: 'user2@example.com', password: 'hashedPwd2', role: 'admin' };
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await authService.validateUser('user2@example.com', 'wrongPwd');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException when validation fails', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue(null as any);
      await expect(
        authService.login('bad@example.com', 'badPwd'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return accessToken and user for valid credentials', async () => {
      const userPayload: any = { id: 3, email: 'user3@example.com', role: 'user' };
      jest.spyOn(authService, 'validateUser').mockResolvedValue(userPayload);

      const result = await authService.login('user3@example.com', 'correctPwd');

      expect(result).toEqual({ accessToken: 'signedToken', user: userPayload });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: userPayload.id, email: userPayload.email, role: userPayload.role },
      );
    });
  });
});
