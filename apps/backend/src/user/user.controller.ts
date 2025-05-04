import { Controller, Post, Body, Get, Param, Put, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    const { firstName, lastName, email, password, role } = createUserDto;
    return this.userService.createUser(firstName, lastName, email, password, role);
  }  

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  async getUser(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.userService.findUserById(id);
  }

  @Put(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string }> {
    await this.userService.deleteUser(id);
    return { message: 'Utilisateur supprimé avec succès.' };
  }

  @Post('reset-password/:id')
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { newPassword: string }
  ): Promise<{ message: string }> {
    await this.userService.resetPassword(id, body.newPassword);
    return { message: 'Mot de passe réinitialisé avec succès.' };
  }
}
