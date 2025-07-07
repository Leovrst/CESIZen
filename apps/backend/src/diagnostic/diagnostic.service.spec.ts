import { Test, TestingModule } from '@nestjs/testing';
import { Repository, ObjectLiteral } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { DiagnosticService } from './diagnostic.service';
import { DiagnosticQuestion } from '../entities/diagnostic-question.entity';
import { DiagnosticResult } from '../entities/diagnostic-result.entity';
import { UserDiagnosticResult } from '../entities/user-diagnostic-result';

type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepository = <
  T extends ObjectLiteral = any,
>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
});

describe('DiagnosticService', () => {
  let service: DiagnosticService;
  let questionRepo: MockRepository<DiagnosticQuestion>;
  let resultRepo: MockRepository<DiagnosticResult>;
  let userResultRepo: MockRepository<UserDiagnosticResult>;

  beforeEach(async () => {
    questionRepo = createMockRepository<DiagnosticQuestion>();
    resultRepo = createMockRepository<DiagnosticResult>();
    userResultRepo = createMockRepository<UserDiagnosticResult>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiagnosticService,
        {
          provide: getRepositoryToken(DiagnosticQuestion),
          useValue: questionRepo,
        },
        { provide: getRepositoryToken(DiagnosticResult), useValue: resultRepo },
        {
          provide: getRepositoryToken(UserDiagnosticResult),
          useValue: userResultRepo,
        },
      ],
    }).compile();

    service = module.get<DiagnosticService>(DiagnosticService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllQuestions', () => {
    it('should return all questions in ascending order', async () => {
      const questions = [{ id: 1 }, { id: 2 }];
      questionRepo.find!.mockResolvedValue(questions as any);

      const result = await service.findAllQuestions();
      expect(questionRepo.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
      expect(result).toEqual(questions);
    });
  });

  describe('findAllResults', () => {
    it('should return all results ordered by minScore ascending', async () => {
      const results = [{ id: 1 }, { id: 2 }];
      resultRepo.find!.mockResolvedValue(results as any);

      const res = await service.findAllResults();
      expect(resultRepo.find).toHaveBeenCalledWith({
        order: { minScore: 'ASC' },
      });
      expect(res).toEqual(results);
    });
  });

  describe('createQuestion', () => {
    it('should create and save a question', async () => {
      const dto = { label: 'Q1', points: 1 };
      const entity = { id: '1', ...dto } as DiagnosticQuestion;
      questionRepo.create!.mockReturnValue(entity);
      questionRepo.save!.mockResolvedValue(entity);

      const res = await service.createQuestion(dto);
      expect(questionRepo.create).toHaveBeenCalledWith(dto);
      expect(questionRepo.save).toHaveBeenCalledWith(entity);
      expect(res).toBe(entity);
    });
  });

  describe('patchQuestion', () => {
    it('should update and return the question', async () => {
      const id = 'abc';
      const dto = { label: 'changed' };
      const updated = { id, ...dto } as DiagnosticQuestion;
      questionRepo.update!.mockResolvedValue(undefined);
      questionRepo.findOne!.mockResolvedValue(updated);

      const res = await service.patchQuestion(id, dto);
      expect(questionRepo.update).toHaveBeenCalledWith(id, dto);
      expect(questionRepo.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(res).toBe(updated);
    });
  });

  describe('removeQuestion', () => {
    it('should delete the question', async () => {
      const id = 'delid';
      questionRepo.delete!.mockResolvedValue(undefined);

      const res = await service.removeQuestion(id);
      expect(questionRepo.delete).toHaveBeenCalledWith(id);
      expect(res).toEqual({ ok: true });
    });
  });

  describe('createResult', () => {
    it('should create and save a result', async () => {
      const dto = { title: 'A', minScore: 0, maxScore: 5, message: 'M' };
      const entity = { id: '2', ...dto } as DiagnosticResult;
      resultRepo.create!.mockReturnValue(entity);
      resultRepo.save!.mockResolvedValue(entity);

      const res = await service.createResult(dto);
      expect(resultRepo.create).toHaveBeenCalledWith(dto);
      expect(resultRepo.save).toHaveBeenCalledWith(entity);
      expect(res).toBe(entity);
    });
  });

  describe('patchResult', () => {
    it('should update and return the result', async () => {
      const id = 'r1';
      const dto = { title: 'B' };
      const updated = { id, ...dto } as DiagnosticResult;
      resultRepo.update!.mockResolvedValue(undefined);
      resultRepo.findOne!.mockResolvedValue(updated);

      const res = await service.patchResult(id, dto);
      expect(resultRepo.update).toHaveBeenCalledWith(id, dto);
      expect(resultRepo.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(res).toBe(updated);
    });
  });

  describe('removeResult', () => {
    it('should delete the result', async () => {
      const id = 'delres';
      resultRepo.delete!.mockResolvedValue(undefined);

      const res = await service.removeResult(id);
      expect(resultRepo.delete).toHaveBeenCalledWith(id);
      expect(res).toEqual({ ok: true });
    });
  });

  describe('evaluate', () => {
    const sampleResults = [
      { id: '1', minScore: 0, maxScore: 5, message: 'Low' } as DiagnosticResult,
      {
        id: '2',
        minScore: 6,
        maxScore: 10,
        message: 'High',
      } as DiagnosticResult,
    ];

    it('should return result for anonymous user', async () => {
      resultRepo.find!.mockResolvedValue(sampleResults as any);
      const response = await service.evaluate(7);

      expect(resultRepo.find).toHaveBeenCalled();
      expect(response).toEqual({ score: 7, result: sampleResults[1] });
    });

    it('should throw NotFoundException if no hit', async () => {
      resultRepo.find!.mockResolvedValue([]);
      await expect(service.evaluate(100)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should return existing user diagnostic if found', async () => {
      const userDiag = {
        userId: 'u1',
        score: 3,
        result: sampleResults[0],
      } as UserDiagnosticResult;
      userResultRepo.findOne!.mockResolvedValue(userDiag as any);

      const res = await service.evaluate(3, 'u1');
      expect(userResultRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
      expect(res).toEqual({ score: 3, result: sampleResults[0] });
    });

    it('should create and save new user diagnostic if not found', async () => {
      userResultRepo.findOne!.mockResolvedValue(null);
      resultRepo.find!.mockResolvedValue(sampleResults as any);
      const hit = sampleResults[0];
      const createdDiag = {
        userId: 'u2',
        score: 4,
        result: hit,
      } as UserDiagnosticResult;
      userResultRepo.create!.mockReturnValue(createdDiag);
      userResultRepo.save!.mockResolvedValue(createdDiag as any);

      const res = await service.evaluate(4, 'u2');

      expect(userResultRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'u2' },
      });
      expect(userResultRepo.create).toHaveBeenCalledWith({
        userId: 'u2',
        resultId: hit.id,
        score: 4,
      });
      expect(userResultRepo.save).toHaveBeenCalledWith(createdDiag);
      expect(res).toEqual({ score: 4, result: hit });
    });
  });

  describe('clearUserResult', () => {
    it('should delete user diagnostic by userId', async () => {
      userResultRepo.delete!.mockResolvedValue(undefined);
      await service.clearUserResult('u3');
      expect(userResultRepo.delete).toHaveBeenCalledWith({ userId: 'u3' });
    });
  });

  describe('getUserResult', () => {
    it('should return the user diagnostic result', async () => {
      const userDiag = { userId: 'u4', score: 5 } as UserDiagnosticResult;
      userResultRepo.findOne!.mockResolvedValue(userDiag as any);
      const res = await service.getUserResult('u4');
      expect(userResultRepo.findOne).toHaveBeenCalledWith({
        where: { userId: 'u4' },
      });
      expect(res).toEqual(userDiag);
    });
  });
});
