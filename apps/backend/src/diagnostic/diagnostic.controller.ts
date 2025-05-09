import { Controller, Get, Put, Body, UseGuards, Post, Query, Request, NotFoundException, Delete } from '@nestjs/common';
import { DiagnosticService } from './diagnostic.service';
import { UpdateQuestionsDto } from './dto/update-questions.dto';
import { UpdateResultsDto } from './dto/update-results.dto';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../authentication/optionnal-jwt.guard';

@Controller('diagnostic')
export class DiagnosticController {
  constructor(private svc: DiagnosticService) {}

  @Get('questions')
  getQuestions() {
    return this.svc.findAllQuestions();
  }

  @Get('results-config')
  getResultsConfig() {
    return this.svc.findAllResults();
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('evaluate')
  async evaluateScore(
    @Query('score') score: string,
    @Request() req,
  ) {
    const numeric = parseInt(score, 10);
    const userId = req.user?.id;
    return this.svc.evaluate(numeric, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('admin/questions')
  updateQuestions(@Body() dto: UpdateQuestionsDto) {
    return this.svc.updateQuestions(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('admin/results')
  updateResults(@Body() dto: UpdateResultsDto) {
    return this.svc.updateResults(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user-result')
  async getUserResult(@Request() req) {
    const userResult = await this.svc.getUserResult(req.user.id);
    if (!userResult) throw new NotFoundException('Pas de résultat');
    return { score: userResult.score, result: userResult.result };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('user-result')
  async clearUserResult(@Request() req) {
    await this.svc.clearUserResult(req.user.id);
    return { ok: true };
  }
}
