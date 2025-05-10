import { Test, TestingModule } from '@nestjs/testing';
import { Repository, ObjectLiteral } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { DiagnosticService } from './diagnostic.service';
import { DiagnosticQuestion } from '../entities/diagnostic-question.entity';
import { DiagnosticResult } from '../entities/diagnostic-result.entity';
import { UserDiagnosticResult } from '../entities/user-diagnostic-result';
import { UpdateQuestionsDto } from './dto/update-questions.dto';
import { UpdateResultsDto } from './dto/update-results.dto';

type MockRepository<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T extends ObjectLiteral = any>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  clear: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
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
        { provide: getRepositoryToken(DiagnosticQuestion), useValue: questionRepo },
        { provide: getRepositoryToken(DiagnosticResult), useValue: resultRepo },
        { provide: getRepositoryToken(UserDiagnosticResult), useValue: userResultRepo },
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
      expect(resultRepo.find).toHaveBeenCalledWith({ order: { minScore: 'ASC' } });
      expect(res).toEqual(results);
    });
  });

  describe('updateQuestions', () => {
    it('should clear and save new questions', async () => {
      const dto: UpdateQuestionsDto = { questions: [{ label: 'Q1', points: 1 }] };
      const createdEntity = { id: '1', label: 'Label1', text: 'Q1', points: 1 } as DiagnosticQuestion;
      questionRepo.create!.mockReturnValue(createdEntity);
      questionRepo.save!.mockResolvedValue([createdEntity]);
      questionRepo.clear!.mockResolvedValue(undefined);

      const result = await service.updateQuestions(dto);

      expect(questionRepo.clear).toHaveBeenCalled();
      expect(questionRepo.create).toHaveBeenCalledWith(dto.questions[0]);
      expect(questionRepo.save).toHaveBeenCalledWith([createdEntity]);
      expect(result).toEqual([createdEntity]);
    });
  });

  describe('updateResults', () => {
    it('should clear and save new results', async () => {
      const dto: UpdateResultsDto = { results: [{ message: 'R1', minScore: 0, maxScore: 10 }] };
      const createdEntity = { message: 'R1', minScore: 0, maxScore: 10 } as DiagnosticResult;
      resultRepo.create!.mockReturnValue(createdEntity);
      resultRepo.save!.mockResolvedValue([createdEntity]);
      resultRepo.clear!.mockResolvedValue(undefined);

      const result = await service.updateResults(dto);

      expect(resultRepo.clear).toHaveBeenCalled();
      expect(resultRepo.create).toHaveBeenCalledWith(dto.results[0]);
      expect(resultRepo.save).toHaveBeenCalledWith([createdEntity]);
      expect(result).toEqual([createdEntity]);
    });
  });

  describe('evaluate', () => {
    const sampleResults = [
      { id: '1', minScore: 0, maxScore: 5, message: 'Low' } as DiagnosticResult,
      { id: '2', minScore: 6, maxScore: 10, message: 'High' } as DiagnosticResult,
    ];

    it('should return result for anonymous user', async () => {
      resultRepo.find!.mockResolvedValue(sampleResults as any);
      const response = await service.evaluate(7);

      expect(resultRepo.find).toHaveBeenCalled();
      expect(response).toEqual({ score: 7, result: sampleResults[1] });
    });

    it('should throw NotFoundException if no hit', async () => {
      resultRepo.find!.mockResolvedValue([]);
      await expect(service.evaluate(100)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should return existing user diagnostic if found', async () => {
      const userDiag = { userId: 'u1', score: 3, result: sampleResults[0] } as UserDiagnosticResult;
      userResultRepo.findOne!.mockResolvedValue(userDiag as any);

      const res = await service.evaluate(3, 'u1');
      expect(userResultRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'u1' } });
      expect(res).toEqual({ score: 3, result: sampleResults[0] });
    });

    it('should create and save new user diagnostic if not found', async () => {
      userResultRepo.findOne!.mockResolvedValue(null);
      resultRepo.find!.mockResolvedValue(sampleResults as any);
      const hit = sampleResults[0];
      const createdDiag = { userId: 'u2', score: 4, result: hit } as UserDiagnosticResult;
      userResultRepo.create!.mockReturnValue(createdDiag);
      userResultRepo.save!.mockResolvedValue(createdDiag as any);

      const res = await service.evaluate(4, 'u2');

      expect(userResultRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'u2' } });
      expect(userResultRepo.create).toHaveBeenCalledWith({ userId: 'u2', resultId: hit.id, score: 4 });
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
      expect(userResultRepo.findOne).toHaveBeenCalledWith({ where: { userId: 'u4' } });
      expect(res).toEqual(userDiag);
    });
  });
});