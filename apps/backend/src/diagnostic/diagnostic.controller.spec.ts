/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';
import { describe, beforeEach, it, expect } from '@jest/globals';

const mockDiagnosticService = () => ({
  findAllQuestions: jest.fn(),
  findAllResults: jest.fn(),
  evaluate: jest.fn(),
  createQuestion: jest.fn(),
  patchQuestion: jest.fn(),
  removeQuestion: jest.fn(),
  createResult: jest.fn(),
  patchResult: jest.fn(),
  removeResult: jest.fn(),
  getUserResult: jest.fn(),
  clearUserResult: jest.fn(),
});

describe('DiagnosticController', () => {
  let controller: DiagnosticController;
  let service: ReturnType<typeof mockDiagnosticService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiagnosticController],
      providers: [
        { provide: DiagnosticService, useFactory: mockDiagnosticService },
      ],
    }).compile();

    controller = module.get<DiagnosticController>(DiagnosticController);
    // Cast du service pour l'autocomplétion et la compatibilité jest
    service = module.get<DiagnosticService>(DiagnosticService) as unknown as ReturnType<typeof mockDiagnosticService>;
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

  // CRUD for Question
  describe('createQuestion', () => {
    it('should call service.createQuestion with dto', async () => {
      const dto = { label: 'Q1', points: 2 };
      const saved = { id: '1', ...dto };
      service.createQuestion.mockResolvedValue(saved);

      const result = await controller.createQuestion(dto);
      expect(service.createQuestion).toHaveBeenCalledWith(dto);
      expect(result).toBe(saved);
    });
  });

  describe('updateQuestion', () => {
    it('should call service.patchQuestion with id and dto', async () => {
      const id = '123';
      const dto = { label: 'modifié' };
      const patched = { id, ...dto };
      service.patchQuestion.mockResolvedValue(patched);

      const result = await controller.updateQuestion(id, dto);
      expect(service.patchQuestion).toHaveBeenCalledWith(id, dto);
      expect(result).toBe(patched);
    });
  });

  describe('deleteQuestion', () => {
    it('should call service.removeQuestion with id', async () => {
      const id = '456';
      const res = { ok: true };
      service.removeQuestion.mockResolvedValue(res);

      const result = await controller.deleteQuestion(id);
      expect(service.removeQuestion).toHaveBeenCalledWith(id);
      expect(result).toBe(res);
    });
  });

  // CRUD for Result
  describe('createResult', () => {
    it('should call service.createResult with dto', async () => {
      const dto = { title: 'T', minScore: 0, maxScore: 5, message: 'msg' };
      const saved = { id: '10', ...dto };
      service.createResult.mockResolvedValue(saved);

      const result = await controller.createResult(dto);
      expect(service.createResult).toHaveBeenCalledWith(dto);
      expect(result).toBe(saved);
    });
  });

  describe('updateResult', () => {
    it('should call service.patchResult with id and dto', async () => {
      const id = '999';
      const dto = { message: 'nouveau message' };
      const patched = { id, ...dto };
      service.patchResult.mockResolvedValue(patched);

      const result = await controller.updateResult(id, dto);
      expect(service.patchResult).toHaveBeenCalledWith(id, dto);
      expect(result).toBe(patched);
    });
  });

  describe('deleteResult', () => {
    it('should call service.removeResult with id', async () => {
      const id = '111';
      const res = { ok: true };
      service.removeResult.mockResolvedValue(res);

      const result = await controller.deleteResult(id);
      expect(service.removeResult).toHaveBeenCalledWith(id);
      expect(result).toBe(res);
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
