import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiagnosticQuestion } from '../entities/diagnostic-question.entity';
import { DiagnosticResult } from '../entities/diagnostic-result.entity';
import { UpdateQuestionsDto } from './dto/update-questions.dto';
import { UpdateResultsDto } from './dto/update-results.dto';
import { UserDiagnosticResult } from '../entities/user-diagnostic-result';

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

  // Pour visiteurs + connectés
  findAllQuestions() {
    return this.questionRepo.find({ order: { id: 'ASC' } });
  }
  findAllResults() {
    return this.resultRepo.find({ order: { minScore: 'ASC' } });
  }

  // Admin : mettre à jour la liste des questions (et points)
  async updateQuestions(dto: UpdateQuestionsDto) {
    // suppression + recréation (simplifié)
    await this.questionRepo.clear();
    const questions = dto.questions.map(q => this.questionRepo.create(q));
    return this.questionRepo.save(questions);
  }

  // Admin : configurer la page de résultats
  async updateResults(dto: UpdateResultsDto) {
    await this.resultRepo.clear();
    const results = dto.results.map(r => this.resultRepo.create(r));
    return this.resultRepo.save(results);
  }

  // Calculer le message selon le score total
  async evaluate(score: number, userId?: string) {

    let userDiagnostic: UserDiagnosticResult | null = null;

    if (userId) {
      userDiagnostic = await this.userResultRepo.findOne({ where: { userId } });
    }

    if (!userDiagnostic) {
      // calcul du message selon score
      const all = await this.findAllResults();
      const hit = all.find(r => score >= r.minScore && score <= r.maxScore);
      if (!hit) throw new NotFoundException('Pas de message pour ce score');

      if (userId) {
        // on enregistre le résultat
        userDiagnostic = this.userResultRepo.create({
          userId,
          resultId: hit.id,
          score,
        });
        await this.userResultRepo.save(userDiagnostic);
      } else {
        // utilisateur anonyme → on renvoie juste le hit
        return { score, result: hit };
      }
    }

    // 2) on a forcément un userDiag (soit existant, soit nouvellement créé)
    return { score: userDiagnostic.score, result: userDiagnostic.result };
  }

  async clearUserResult(userId: string) {
    await this.userResultRepo.delete({ userId });
  }

  async getUserResult(userId: string) {
    return this.userResultRepo.findOne({ where: { userId } });
  }
}
