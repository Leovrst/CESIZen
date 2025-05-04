import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum RequestStatus {
  PENDING = 'En attente',
  APPROVED = 'Approuvée',
  REJECTED = 'Rejetée',
}

@Entity('reactivation_requests')
export class ReactivationRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column()
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;
}
