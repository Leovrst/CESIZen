import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import {
  ReactivationRequest,
  RequestStatus,
} from '../../entities/reactivationRequest.entity';

@Injectable()
export class ReactivationRequestRepository {
  constructor(
    @InjectRepository(ReactivationRequest)
    private readonly repo: Repository<ReactivationRequest>,
  ) {}

  async createAndSave(
    data: Partial<ReactivationRequest>,
  ): Promise<ReactivationRequest> {
    const request = this.repo.create(data);
    return this.repo.save(request);
  }

  async findAll(): Promise<ReactivationRequest[]> {
    return this.repo.find();
  }

  async findPendingByUserId(
    userId: string,
  ): Promise<ReactivationRequest | null> {
    return this.repo.findOne({
      where: {
        user: { id: userId },
        status: RequestStatus.PENDING,
      },
    });
  }

  async updateRequest(
    id: string,
    updateData: Partial<ReactivationRequest>,
  ): Promise<ReactivationRequest> {
    await this.repo.update(id, updateData);
    const request = await this.repo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException(`ReactivationRequest with id ${id} not found`);
    }
    return request;
  }

  async hasRecentRejected(userId: string, since: Date): Promise<boolean> {
    const count = await this.repo.count({
      where: {
        user: { id: userId },
        status: RequestStatus.REJECTED,
        createdAt: MoreThan(since),
      },
    });
    return count > 0;
  }
}
