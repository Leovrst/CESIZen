import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReactivationRequest } from '../entities/reactivationRequest.entity';
import { ReactivationRequestController } from './reactivationRequest.controller';
import { ReactivationRequestService } from './reactivationRequest.service';
import { ReactivationRequestRepository } from './dto/reactivationRequest.repository';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReactivationRequest]), forwardRef(() => UserModule)],
  controllers: [ReactivationRequestController],
  providers: [ReactivationRequestService, ReactivationRequestRepository],
  exports: [ReactivationRequestService],
})
export class ReactivationRequestModule {}
