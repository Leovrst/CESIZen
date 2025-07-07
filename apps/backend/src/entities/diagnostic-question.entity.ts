import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class DiagnosticQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  label: string;

  @Column('int')
  points: number;
}
