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
      const mockUser: any = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPwd',
        role: 'user',
      };
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateUser(
        'test@example.com',
        'plainPwd',
      );

      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'user',
      });
      expect(userService.findUserByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should return null if user not found', async () => {
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(null);
      const result = await authService.validateUser(
        'notfound@example.com',
        'any',
      );
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const mockUser: any = {
        id: 2,
        email: 'user2@example.com',
        password: 'hashedPwd2',
        role: 'admin',
      };
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await authService.validateUser(
        'user2@example.com',
        'wrongPwd',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(null);
      await expect(authService.login('not@found.com', 'pass'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is suspended for brute force', async () => {
      const user = { id: '1', email: 'b@b.com', password: 'hashed', suspended: true, suspensionReason: 'BRUTE_FORCE' };
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(user);
      await expect(authService.login('b@b.com', 'pass'))
        .rejects.toThrow(/trop de tentatives/i);
    });

    it('should increment loginAttempts and throw if password is wrong', async () => {
      const user = { id: '2', email: 'c@c.com', password: 'hashed', suspended: false, loginAttempts: 0 };
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(user);
      (jest.spyOn(bcrypt, 'compare') as any).mockResolvedValue(false);
      userService.incrementLoginAttempts = jest.fn();
      userService.findUserById = jest.fn().mockResolvedValue({ ...user, loginAttempts: 1 });

      await expect(authService.login('c@c.com', 'wrongpass'))
        .rejects.toThrow(/identifiants incorrects/i);

      expect(userService.incrementLoginAttempts).toHaveBeenCalledWith('2');
    });

    it('should suspend user and throw if loginAttempts >= 5', async () => {
      const user = { id: '3', email: 'd@d.com', password: 'hashed', suspended: false, loginAttempts: 4 };
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(user);
      (jest.spyOn(bcrypt, 'compare') as any).mockResolvedValue(false);
      userService.incrementLoginAttempts = jest.fn();
      userService.findUserById = jest.fn().mockResolvedValue({ ...user, loginAttempts: 5 });
      userService.suspendUserAndCreateReactivationRequest = jest.fn();

      await expect(authService.login('d@d.com', 'wrongpass'))
        .rejects.toThrow(/compte suspendu/i);

      expect(userService.suspendUserAndCreateReactivationRequest).toHaveBeenCalledWith('3');
    });

    it('should reset loginAttempts and return token and user if password ok', async () => {
      const user = { id: '4', email: 'e@e.com', password: 'hashed', role: 'user', suspended: false };
      (userService.findUserByEmail as jest.Mock).mockResolvedValue(user);
      (jest.spyOn(bcrypt, 'compare') as any).mockResolvedValue(true);
      userService.resetLoginAttempts = jest.fn();

      const result = await authService.login('e@e.com', 'goodpass');
      expect(userService.resetLoginAttempts).toHaveBeenCalledWith('4');
      expect(result.accessToken).toBe('signedToken');
      expect(result.user).toEqual(user);
    });
  });
});
