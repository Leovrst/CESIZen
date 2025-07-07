import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Post,
  Query,
  Request,
  NotFoundException,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { DiagnosticService } from './diagnostic.service';
import { UpdateQuestionDto } from './dto/update-questions.dto';
import { UpdateResultDto } from './dto/update-results.dto';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from '../authentication/optionnal-jwt.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateResultDto } from './dto/create-result.dto';

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
  async evaluateScore(@Query('score') score: string, @Request() req) {
    const numeric = parseInt(score, 10);
    const userId = req.user?.id;
    return this.svc.evaluate(numeric, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/questions')
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.svc.createQuestion(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.svc.patchQuestion(id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.svc.removeQuestion(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('admin/results')
  createResult(@Body() dto: CreateResultDto) {
    return this.svc.createResult(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('admin/results/:id')
  updateResult(@Param('id') id: string, @Body() dto: UpdateResultDto) {
    return this.svc.patchResult(id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('admin/results/:id')
  deleteResult(@Param('id') id: string) {
    return this.svc.removeResult(id);
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
