import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ReactivationRequest, RequestStatus } from '../entities/reactivationRequest.entity';
import { ReactivationRequestRepository } from './dto/reactivationRequest.repository';
import { UserService } from '../user/user.service';

@Injectable()
export class ReactivationRequestService {
  constructor(
    private readonly requestRepository: ReactivationRequestRepository,
    private readonly userService: UserService,
  ) {}

  async createRequest(userId: number, comment: string): Promise<ReactivationRequest> {
    const user = await this.userService.findUserById(userId);
    if (!user) throw new NotFoundException("Utilisateur non trouvé.");
  
    const already = await this.requestRepository.findPendingByUserId(userId);
    if (already) {
      throw new BadRequestException("Vous avez déjà une demande en cours de traitement.");
    }
  
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
    const hasRecentRejected = await this.requestRepository.hasRecentRejected(userId, oneWeekAgo);
    if (hasRecentRejected) {
      throw new BadRequestException(
        "Votre dernière demande a été refusée. Vous pouvez en soumettre une nouvelle dans une semaine."
      );
    }

    const data: Partial<ReactivationRequest> = {
      user,
      comment,
      status: RequestStatus.PENDING,
    };
    return this.requestRepository.createAndSave(data);
  }

  async getAllRequests(): Promise<ReactivationRequest[]> {
    return this.requestRepository.findAll();
  }

  async approveRequest(requestId: number): Promise<ReactivationRequest> {
    const request = await this.requestRepository.updateRequest(requestId, { status: RequestStatus.APPROVED });
    if (!request) throw new NotFoundException("Demande non trouvée.");
    await this.userService.updateUser(request.user.id, { suspended: false });
    return request;
  }

  async rejectRequest(requestId: number, rejectionComment: string): Promise<ReactivationRequest> {
    const request = await this.requestRepository.updateRequest(requestId, { status: RequestStatus.REJECTED });
    if (!request) throw new NotFoundException("Demande non trouvée.");
    // Ici, vous pouvez enregistrer la date du rejet ou imposer une interdiction de soumettre une nouvelle demande pendant 1 mois.
    // Cette logique dépend de votre implémentation.
    return request;
  }
}
