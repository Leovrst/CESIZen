import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../entities/user.entity';
import { DiagnosticResult } from './diagnostic-result.entity';

@Entity()
export class UserDiagnosticResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => DiagnosticResult, { eager: true })
  @JoinColumn({ name: 'resultId' })
  result: DiagnosticResult;

  @Column()
  resultId: string;

  @Column('int')
  score: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  takenAt: Date;
}
