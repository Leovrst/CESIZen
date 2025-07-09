import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { UserRepository } from './dto/user.repository';
import { User, UserRole } from '../entities/user.entity';

type MockRepo = {
  findByEmail: jest.Mock<Promise<User | null>, [string]>;
  createAndSave: jest.Mock<Promise<User>, [Partial<User>]>;
  findById: jest.Mock<Promise<User | null>, [string]>;
  updateUser: jest.Mock<Promise<User>, [string, Partial<User>]>;
  deleteUser: jest.Mock<Promise<void>, [string]>;
  findAll: jest.Mock<Promise<User[]>, []>;
  incrementLoginAttempts?: jest.Mock<Promise<void>, [string]>;
};

describe('UserService', () => {
  let service: UserService;
  let userRepository: MockRepo;
  const mockReactivationRequestService = {
    createRequest: jest.fn(),
  };

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn<Promise<User | null>, [string]>(),
      createAndSave: jest.fn<Promise<User>, [Partial<User>]>(),
      findById: jest.fn<Promise<User | null>, [string]>(),
      updateUser: jest.fn<Promise<User>, [string, Partial<User>]>(),
      deleteUser: jest.fn<Promise<void>, [string]>(),
      findAll: jest.fn<Promise<User[]>, []>(),
      incrementLoginAttempts: jest.fn<Promise<void>, [string]>(),
    };

    service = new UserService(
      userRepository as unknown as UserRepository,
      mockReactivationRequestService as any
    );
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const firstName = 'John';
    const lastName = 'Doe';
    const email = 'john.doe@example.com';
    const password = 'password123';

    it('throws ConflictException if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({} as User);
      await expect(
        service.createUser(firstName, lastName, email, password),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('hashes password and saves user when email is new', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      (jest.spyOn(bcrypt, 'hash') as any).mockResolvedValue('hashedPass');
      const savedUser = {
        id: '1',
        firstName,
        lastName,
        email,
        password: 'hashedPass',
      } as User;
      userRepository.createAndSave.mockResolvedValue(savedUser);

      const result = await service.createUser(
        firstName,
        lastName,
        email,
        password,
        UserRole.ADMIN,
      );

      expect(userRepository.createAndSave).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName,
          lastName,
          email,
          password: 'hashedPass',
          role: UserRole.ADMIN,
          suspended: false,
          registeredAt: expect.any(Date),
        }),
      );
      expect(result).toBe(savedUser);
    });
  });

  describe('findUserByEmail', () => {
    it('returns user if found', async () => {
      const user = { id: '1' } as User;
      userRepository.findByEmail.mockResolvedValue(user);
      await expect(service.findUserByEmail('a@b.com')).resolves.toBe(user);
    });

    it('throws NotFoundException if not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      await expect(service.findUserByEmail('a@b.com')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findUserById', () => {
    it('returns user if found', async () => {
      const user = { id: '1' } as User;
      userRepository.findById.mockResolvedValue(user);
      await expect(service.findUserById('1')).resolves.toBe(user);
    });

    it('throws NotFoundException if not found', async () => {
      userRepository.findById.mockResolvedValue(null);
      await expect(service.findUserById('1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('hashes new password if provided and updates', async () => {
      const id = '1';
      const newPassword = 'newpass';
      (jest.spyOn(bcrypt, 'hash') as any).mockResolvedValue('newHashed');
      const updatedUser = { id, password: 'newHashed' } as User;
      userRepository.updateUser.mockResolvedValue(updatedUser);

      const result = await service.updateUser(id, { password: newPassword });

      expect(userRepository.updateUser).toHaveBeenCalledWith(id, {
        password: 'newHashed',
      });
      expect(result).toBe(updatedUser);
    });

    it('updates without hashing if no password provided', async () => {
      const id = '1';
      const updateData = { firstName: 'Jane' };
      const updatedUser = { id, ...updateData } as User;
      userRepository.updateUser.mockResolvedValue(updatedUser);

      const result = await service.updateUser(id, updateData);

      expect(userRepository.updateUser).toHaveBeenCalledWith(id, updateData);
      expect(result).toBe(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('deletes existing user', async () => {
      const id = '1';
      const user = { id } as User;
      jest.spyOn(service, 'findUserById').mockResolvedValue(user);
      userRepository.deleteUser.mockResolvedValue();

      await expect(service.deleteUser(id)).resolves.toBeUndefined();
      expect(userRepository.deleteUser).toHaveBeenCalledWith(id);
    });

    it('throws NotFoundException if user does not exist', async () => {
      const id = '1';
      jest
        .spyOn(service, 'findUserById')
        .mockRejectedValue(new NotFoundException());

      await expect(service.deleteUser(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getAllUsers', () => {
    it('returns list of users', async () => {
      const users = [{ id: '1' }, { id: '2' }] as User[];
      userRepository.findAll.mockResolvedValue(users);
      await expect(service.getAllUsers()).resolves.toBe(users);
    });
  });

  describe('resetPassword', () => {
    it('hashes new password and updates user', async () => {
      const id = '1';
      const newPass = 'pass';
      (jest.spyOn(bcrypt, 'hash') as any).mockResolvedValue('hashedNew');
      const updatedUser = { id, password: 'hashedNew' } as User;
      userRepository.updateUser.mockResolvedValue(updatedUser);

      await expect(service.resetPassword(id, newPass)).resolves.toBeUndefined();
      expect(userRepository.updateUser).toHaveBeenCalledWith(id, {
        password: 'hashedNew',
      });
    });
  });
});
