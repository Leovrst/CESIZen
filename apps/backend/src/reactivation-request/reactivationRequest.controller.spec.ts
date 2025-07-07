import { ReactivationRequestController } from './reactivationRequest.controller';
import { ReactivationRequestService } from './reactivationRequest.service';
import { CreateReactivationRequestDto } from './dto/createReactivationRequest.dto';
import {
  ReactivationRequest,
  RequestStatus,
} from '../entities/reactivationRequest.entity';
import { BadRequestException } from '@nestjs/common';

describe('ReactivationRequestController', () => {
  let controller: ReactivationRequestController;
  let mockService: jest.Mocked<ReactivationRequestService>;

  const user = { id: 'user-id', suspended: true } as any;
  const request: ReactivationRequest = {
    id: 'req-id',
    user,
    comment: 'Please reactivate',
    status: RequestStatus.PENDING,
  } as ReactivationRequest;

  beforeEach(() => {
    mockService = {
      createRequest: jest.fn(),
      getAllRequests: jest.fn(),
      approveRequest: jest.fn(),
      rejectRequest: jest.fn(),
    } as any;

    controller = new ReactivationRequestController(mockService);
  });

  describe('createRequest', () => {
    it('should throw BadRequestException if userId is missing', async () => {
      const dto = {
        comment: 'no user id',
      } as any as CreateReactivationRequestDto;
      await expect(controller.createRequest(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call service.createRequest with correct params', async () => {
      const dto: CreateReactivationRequestDto = {
        userId: 'user-id',
        comment: 'please',
      };
      mockService.createRequest.mockResolvedValue(request);

      const result = await controller.createRequest(dto);

      expect(mockService.createRequest).toHaveBeenCalledWith(
        'user-id',
        'please',
      );
      expect(result).toBe(request);
    });
  });

  describe('getAllRequests', () => {
    it('should return all requests', async () => {
      mockService.getAllRequests.mockResolvedValue([request]);

      const result = await controller.getAllRequests();

      expect(mockService.getAllRequests).toHaveBeenCalled();
      expect(result).toEqual([request]);
    });
  });

  describe('approveRequest', () => {
    it('should call service.approveRequest and return its result', async () => {
      mockService.approveRequest.mockResolvedValue(request);

      const result = await controller.approveRequest(request.id);

      expect(mockService.approveRequest).toHaveBeenCalledWith(request.id);
      expect(result).toBe(request);
    });
  });

  describe('rejectRequest', () => {
    it('should call service.rejectRequest and return its result', async () => {
      const rejectionComment = 'no good';
      mockService.rejectRequest.mockResolvedValue(request);

      const result = await controller.rejectRequest(
        request.id,
        rejectionComment,
      );

      expect(mockService.rejectRequest).toHaveBeenCalledWith(
        request.id,
        rejectionComment,
      );
      expect(result).toBe(request);
    });
  });
});
