import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosticQuestion } from '../entities/diagnostic-question.entity';
import { DiagnosticResult } from '../entities/diagnostic-result.entity';
import { UpdateQuestionDto } from './dto/update-questions.dto';
import { UpdateResultDto } from './dto/update-results.dto';
import { UserDiagnosticResult } from '../entities/user-diagnostic-result';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateResultDto } from './dto/create-result.dto';

@Injectable()
export class DiagnosticService {
  constructor(
    @InjectRepository(DiagnosticQuestion)
    private questionRepo: Repository<DiagnosticQuestion>,
    @InjectRepository(DiagnosticResult)
    private resultRepo: Repository<DiagnosticResult>,
    @InjectRepository(UserDiagnosticResult)
    private userResultRepo: Repository<UserDiagnosticResult>,
  ) {}

  findAllQuestions() {
    return this.questionRepo.find({ order: { id: 'ASC' } });
  }
  findAllResults() {
    return this.resultRepo.find({ order: { minScore: 'ASC' } });
  }

  async createQuestion(dto: CreateQuestionDto) {
    const q = this.questionRepo.create(dto);
    return this.questionRepo.save(q);
  }

  async patchQuestion(id: string, dto: UpdateQuestionDto) {
    await this.questionRepo.update(id, dto);
    return this.questionRepo.findOne({ where: { id } });
  }

  async removeQuestion(id: string) {
    await this.questionRepo.delete(id);
    return { ok: true };
  }

  async createResult(dto: CreateResultDto) {
    const r = this.resultRepo.create(dto);
    return this.resultRepo.save(r);
  }

  async patchResult(id: string, dto: UpdateResultDto) {
    await this.resultRepo.update(id, dto);
    return this.resultRepo.findOne({ where: { id } });
  }

  async removeResult(id: string) {
    await this.resultRepo.delete(id);
    return { ok: true };
  }

  async evaluate(score: number, userId?: string) {

    let userDiagnostic: UserDiagnosticResult | null = null;

    if (userId) {
      userDiagnostic = await this.userResultRepo.findOne({ where: { userId } });
    }

    if (!userDiagnostic) {
      const all = await this.findAllResults();
      const hit = all.find(r => score >= r.minScore && score <= r.maxScore);
      if (!hit) throw new NotFoundException('Pas de message pour ce score');

      if (userId) {
        userDiagnostic = this.userResultRepo.create({
          userId,
          resultId: hit.id,
          score,
        });
        await this.userResultRepo.save(userDiagnostic);
      } else {
        return { score, result: hit };
      }
    }

    return { score: userDiagnostic.score, result: userDiagnostic.result };
  }

  async clearUserResult(userId: string) {
    await this.userResultRepo.delete({ userId });
  }

  async getUserResult(userId: string) {
    return this.userResultRepo.findOne({ where: { userId } });
  }
}
