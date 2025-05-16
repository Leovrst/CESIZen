import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class DiagnosticResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  minScore: number;

  @Column()
  maxScore: number;

  @Column()
  message: string;
}