import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  Put,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { ReactivationRequestService } from './reactivationRequest.service';
import { CreateReactivationRequestDto } from './dto/createReactivationRequest.dto';
import { ReactivationRequest } from '../entities/reactivationRequest.entity';

@Controller('reactivation-requests')
export class ReactivationRequestController {
  constructor(private readonly requestService: ReactivationRequestService) {}

  @Post()
  async createRequest(
    @Body() dto: CreateReactivationRequestDto,
  ): Promise<ReactivationRequest> {
    const { userId, comment } = dto;
    if (!userId) {
      throw new BadRequestException("L'ID de l'utilisateur est requis");
    }
    return this.requestService.createRequest(userId, comment);
  }

  @Get()
  async getAllRequests(): Promise<ReactivationRequest[]> {
    return this.requestService.getAllRequests();
  }

  @Put(':id/approve')
  async approveRequest(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReactivationRequest> {
    return this.requestService.approveRequest(id);
  }

  @Put(':id/reject')
  async rejectRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rejectionComment') rejectionComment: string,
  ): Promise<ReactivationRequest> {
    return this.requestService.rejectRequest(id, rejectionComment);
  }
}
