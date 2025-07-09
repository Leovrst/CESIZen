import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosticQuestion } from '../entities/diagnostic-question.entity';
import { DiagnosticResult } from '../entities/diagnostic-result.entity';
import { DiagnosticService } from './diagnostic.service';
import { DiagnosticController } from './diagnostic.controller';
import { UserDiagnosticResult } from '../entities/user-diagnostic-result';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiagnosticQuestion,
      DiagnosticResult,
      UserDiagnosticResult,
    ]),
  ],
  providers: [DiagnosticService],
  controllers: [DiagnosticController],
})
export class DiagnosticModule {}
