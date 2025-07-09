import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { UserRepository } from './dto/user.repository';
import { UpdateUserDto } from './dto/updateUser.dto';
import { ReactivationRequestService } from '../reactivation-request/reactivationRequest.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly reactivationRequestService: ReactivationRequestService,
  ) { }

  async createUser(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role?: UserRole,
  ): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const registeredAt = new Date();
    const userData: Partial<User> = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      registeredAt,
      suspended: false,
      role: role ? role : UserRole.USER,
    };

    return this.userRepository.createAndSave(userData);
  }

  async findUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException(
        `Aucun utilisateur trouvé avec l'email ${email}`,
      );
    }
    return user;
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Aucun utilisateur trouvé avec l'ID ${id}`);
    }
    return user;
  }

  async updateUser(
    id: string,
    updateData: Partial<UpdateUserDto>,
  ): Promise<User> {
    const dataToUpdate: Partial<User> = { ...updateData };

    if (dataToUpdate.password) {
      dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, 10);
    }

    if (dataToUpdate.suspended === true && !dataToUpdate.suspensionReason) {
      dataToUpdate.suspensionReason = 'ADMIN';
    }
    if (dataToUpdate.suspended === false) {
      dataToUpdate.suspensionReason = undefined;
    }

    return this.userRepository.updateUser(id, dataToUpdate);
  }

  async deleteUser(id: string): Promise<void> {
    await this.findUserById(id);
    await this.userRepository.deleteUser(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updateUser(id, { password: hashedPassword });
  }

  async incrementLoginAttempts(userId: string) {
    await this.userRepository.incrementLoginAttempts(userId);
  }

  async resetLoginAttempts(userId: string) {
    await this.userRepository.updateUser(userId, { loginAttempts: 0 });
  }

  async suspendUserAndCreateReactivationRequest(userId: string) {
    await this.userRepository.updateUser(userId, {
      suspended: true,
      suspensionReason: 'BRUTE_FORCE',
    });
    await this.reactivationRequestService.createRequest(
      userId,
      "Blocage automatique après 5 tentatives échouées."
    );
  }
}
