import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';
import { UpdateQuestionsDto } from './dto/update-questions.dto';
import { UpdateResultsDto } from './dto/update-results.dto';

const mockDiagnosticService = () => ({
  findAllQuestions: jest.fn(),
  findAllResults: jest.fn(),
  evaluate: jest.fn(),
  updateQuestions: jest.fn(),
  updateResults: jest.fn(),
  getUserResult: jest.fn(),
  clearUserResult: jest.fn(),
});

describe('DiagnosticController', () => {
  let controller: DiagnosticController;
  let service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiagnosticController],
      providers: [
        { provide: DiagnosticService, useFactory: mockDiagnosticService },
      ],
    }).compile();

    controller = module.get<DiagnosticController>(DiagnosticController);
    service = module.get<DiagnosticService>(DiagnosticService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getQuestions', () => {
    it('should call service.findAllQuestions and return its value', async () => {
      const questions = [{ id: 1 }];
      service.findAllQuestions.mockResolvedValue(questions);

      const result = await controller.getQuestions();
      expect(service.findAllQuestions).toHaveBeenCalled();
      expect(result).toBe(questions);
    });
  });

  describe('getResultsConfig', () => {
    it('should call service.findAllResults and return its value', async () => {
      const results = [{ id: 2 }];
      service.findAllResults.mockResolvedValue(results);

      const res = await controller.getResultsConfig();
      expect(service.findAllResults).toHaveBeenCalled();
      expect(res).toBe(results);
    });
  });

  describe('evaluateScore', () => {
    it('should parse score and call service.evaluate without userId', async () => {
      const svcResult = { score: 5, result: {} as any };
      service.evaluate.mockResolvedValue(svcResult);

      const req = { user: undefined };
      const res = await controller.evaluateScore('5', req);

      expect(service.evaluate).toHaveBeenCalledWith(5, undefined);
      expect(res).toBe(svcResult);
    });

    it('should pass userId to service.evaluate if present', async () => {
      const svcResult = { score: 8, result: {} as any };
      service.evaluate.mockResolvedValue(svcResult);

      const req = { user: { id: 'user123' } };
      const res = await controller.evaluateScore('8', req);

      expect(service.evaluate).toHaveBeenCalledWith(8, 'user123');
      expect(res).toBe(svcResult);
    });
  });

  describe('updateQuestions', () => {
    it('should call service.updateQuestions with dto', async () => {
      const dto: UpdateQuestionsDto = { questions: [{ label: 'Q', points: 1 }] };
      const saved = [{ id: 1 }];
      service.updateQuestions.mockResolvedValue(saved);

      const res = await controller.updateQuestions(dto);
      expect(service.updateQuestions).toHaveBeenCalledWith(dto);
      expect(res).toBe(saved);
    });
  });

  describe('updateResults', () => {
    it('should call service.updateResults with dto', async () => {
      const dto: UpdateResultsDto = { results: [{ message: 'R', minScore: 0, maxScore: 5 }] };
      const saved = [{ id: 2 }];
      service.updateResults.mockResolvedValue(saved);

      const res = await controller.updateResults(dto);
      expect(service.updateResults).toHaveBeenCalledWith(dto);
      expect(res).toBe(saved);
    });
  });

  describe('getUserResult', () => {
    it('should return result when service.getUserResult returns a value', async () => {
      const userDiag = { score: 3, result: { id: 1 } };
      service.getUserResult.mockResolvedValue(userDiag as any);

      const req = { user: { id: 'u1' } };
      const res = await controller.getUserResult(req);

      expect(service.getUserResult).toHaveBeenCalledWith('u1');
      expect(res).toEqual({ score: userDiag.score, result: userDiag.result });
    });

    it('should throw NotFoundException if no result', async () => {
      service.getUserResult.mockResolvedValue(null);
      const req = { user: { id: 'u2' } };

      await expect(controller.getUserResult(req)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('clearUserResult', () => {
    it('should call service.clearUserResult and return ok true', async () => {
      service.clearUserResult.mockResolvedValue(undefined);
      const req = { user: { id: 'u3' } };

      const res = await controller.clearUserResult(req);
      expect(service.clearUserResult).toHaveBeenCalledWith('u3');
      expect(res).toEqual({ ok: true });
    });
  });
});
