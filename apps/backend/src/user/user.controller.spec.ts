import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { User, UserRole } from '../entities/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            createUser: jest.fn(),
            getAllUsers: jest.fn(),
            findUserById: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService) as jest.Mocked<UserService>;
  });

  describe('register', () => {
    it('should call userService.createUser and return the user', async () => {
      const dto: CreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'secret',
        role: UserRole.USER,
      };
      const createdUser: User = { id: '1', ...dto, password: 'hashed', registeredAt: new Date(), suspended: false } as User;
      userService.createUser.mockResolvedValue(createdUser);

      const result = await controller.register(dto);

      expect(userService.createUser).toHaveBeenCalledWith(
        dto.firstName,
        dto.lastName,
        dto.email,
        dto.password,
        dto.role,
      );
      expect(result).toBe(createdUser);
    });
  });

  describe('getAllUsers', () => {
    it('should return an array of users', async () => {
      const users: User[] = [];
      userService.getAllUsers.mockResolvedValue(users);
      const result = await controller.getAllUsers();
      expect(userService.getAllUsers).toHaveBeenCalled();
      expect(result).toBe(users);
    });
  });

  describe('getUser', () => {
    it('should return a single user by id', async () => {
      const user: User = { id: '1' } as User;
      userService.findUserById.mockResolvedValue(user);
      const result = await controller.getUser('1');
      expect(userService.findUserById).toHaveBeenCalledWith('1');
      expect(result).toBe(user);
    });
  });

  describe('updateUser', () => {
    it('should update and return the updated user', async () => {
      const dto: UpdateUserDto = { firstName: 'Jane' };
      const updated: User = { id: '1', ...dto } as User;
      userService.updateUser.mockResolvedValue(updated);
      const result = await controller.updateUser('1', dto);
      expect(userService.updateUser).toHaveBeenCalledWith('1', dto);
      expect(result).toBe(updated);
    });
  });

  describe('deleteUser', () => {
    it('should delete the user and return a message', async () => {
      userService.deleteUser.mockResolvedValue(undefined);
      const result = await controller.deleteUser('1');
      expect(userService.deleteUser).toHaveBeenCalledWith('1');
      expect(result).toEqual({ message: 'Utilisateur supprimé avec succès.' });
    });
  });

  describe('resetPassword', () => {
    it('should reset the password and return a message', async () => {
      userService.resetPassword.mockResolvedValue(undefined);
      const body = { newPassword: 'newSecret' };
      const result = await controller.resetPassword('1', body);
      expect(userService.resetPassword).toHaveBeenCalledWith('1', body.newPassword);
      expect(result).toEqual({ message: 'Mot de passe réinitialisé avec succès.' });
    });
  });
});