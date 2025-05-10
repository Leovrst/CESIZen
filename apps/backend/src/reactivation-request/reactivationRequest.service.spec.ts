import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReactivationRequestService } from './reactivationRequest.service';
import { ReactivationRequest, RequestStatus } from '../entities/reactivationRequest.entity';
import { ReactivationRequestRepository } from './dto/reactivationRequest.repository';
import { UserService } from '../user/user.service';

describe('ReactivationRequestService', () => {
  let service: ReactivationRequestService;
  let mockRepo: jest.Mocked<ReactivationRequestRepository>;
  let mockUserService: jest.Mocked<UserService>;

  const user = { id: 'user-id', suspended: true } as any;
  const request: ReactivationRequest = {
    id: 'req-id',
    user,
    comment: 'Please reactivate',
    status: RequestStatus.PENDING,
  } as ReactivationRequest;

  beforeEach(() => {
    mockRepo = {
      findPendingByUserId: jest.fn(),
      hasRecentRejected: jest.fn(),
      createAndSave: jest.fn(),
      findAll: jest.fn(),
      updateRequest: jest.fn(),
    } as any;

    mockUserService = {
      findUserById: jest.fn(),
      updateUser: jest.fn(),
    } as any;

    service = new ReactivationRequestService(mockRepo, mockUserService);
  });

  describe('createRequest', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUserService.findUserById.mockResolvedValue(null as any);

      await expect(service.createRequest('unknown-user', 'comment')).rejects.toThrow(NotFoundException);
      expect(mockUserService.findUserById).toHaveBeenCalledWith('unknown-user');
    });

    it('should throw BadRequestException if a pending request exists', async () => {
      mockUserService.findUserById.mockResolvedValue(user);
      mockRepo.findPendingByUserId.mockResolvedValue(request as any);

      await expect(service.createRequest(user.id, 'comment')).rejects.toThrow(BadRequestException);
      expect(mockRepo.findPendingByUserId).toHaveBeenCalledWith(user.id);
    });

    it('should throw BadRequestException if a recent rejected request exists', async () => {
      mockUserService.findUserById.mockResolvedValue(user);
      mockRepo.findPendingByUserId.mockResolvedValue(null);
      mockRepo.hasRecentRejected.mockResolvedValue(true);

      await expect(service.createRequest(user.id, 'comment')).rejects.toThrow(BadRequestException);
      expect(mockRepo.hasRecentRejected).toHaveBeenCalledWith(
        user.id,
        expect.any(Date)
      );
    });

    it('should create and save a new request if no conflicts', async () => {
      mockUserService.findUserById.mockResolvedValue(user);
      mockRepo.findPendingByUserId.mockResolvedValue(null);
      mockRepo.hasRecentRejected.mockResolvedValue(false);
      mockRepo.createAndSave.mockResolvedValue(request as any);

      const result = await service.createRequest(user.id, 'comment');

      expect(mockRepo.createAndSave).toHaveBeenCalledWith({
        user,
        comment: 'comment',
        status: RequestStatus.PENDING,
      });
      expect(result).toBe(request);
    });
  });

  describe('getAllRequests', () => {
    it('should return all requests', async () => {
      mockRepo.findAll.mockResolvedValue([request]);
      const result = await service.getAllRequests();
      expect(result).toEqual([request]);
      expect(mockRepo.findAll).toHaveBeenCalled();
    });
  });

  describe('approveRequest', () => {
    it('should throw NotFoundException if request not found', async () => {
      mockRepo.updateRequest.mockResolvedValue(null as any);

      await expect(service.approveRequest('invalid-id')).rejects.toThrow(NotFoundException);
      expect(mockRepo.updateRequest).toHaveBeenCalledWith('invalid-id', { status: RequestStatus.APPROVED });
    });

    it('should approve the request and update the user', async () => {
      const approvedRequest = { ...request, status: RequestStatus.APPROVED } as any;
      mockRepo.updateRequest.mockResolvedValue(approvedRequest);

      const result = await service.approveRequest(request.id);

      expect(mockRepo.updateRequest).toHaveBeenCalledWith(request.id, { status: RequestStatus.APPROVED });
      expect(mockUserService.updateUser).toHaveBeenCalledWith(user.id, { suspended: false });
      expect(result).toBe(approvedRequest);
    });
  });

  describe('rejectRequest', () => {
    it('should throw NotFoundException if request not found', async () => {
      mockRepo.updateRequest.mockResolvedValue(null as any);

      await expect(service.rejectRequest('invalid-id', 'Nope')).rejects.toThrow(NotFoundException);
      expect(mockRepo.updateRequest).toHaveBeenCalledWith('invalid-id', { status: RequestStatus.REJECTED });
    });

    it('should reject the request', async () => {
      const rejectedRequest = { ...request, status: RequestStatus.REJECTED } as any;
      mockRepo.updateRequest.mockResolvedValue(rejectedRequest);

      const result = await service.rejectRequest(request.id, 'Not valid');

      expect(mockRepo.updateRequest).toHaveBeenCalledWith(request.id, { status: RequestStatus.REJECTED });
      expect(result).toBe(rejectedRequest);
      expect(mockUserService.updateUser).not.toHaveBeenCalled();
    });
  });
});
