import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserRepository } from './dto/user.repository';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ReactivationRequestModule } from '../reactivation-request/reactivationRequest.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => ReactivationRequestModule)],
  providers: [UserRepository, UserService],
  controllers: [UserController],
  exports: [UserService, UserRepository],
})
export class UserModule {}
