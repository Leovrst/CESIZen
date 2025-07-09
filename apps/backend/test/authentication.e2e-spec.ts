import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('AuthenticationController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));

    const password = await bcrypt.hash('Password123!', 10);
    await userRepository.save({
      email: 'testuser@email.com',
      firstName: 'Test',
      lastName: 'User',
      registeredAt: new Date(),
      password,
      role: UserRole.USER,
      suspended: false,
      loginAttempts: 0,
    });
  });

  afterAll(async () => {
    await userRepository.delete({ email: 'testuser@email.com' });
    await app.close();
  });

  it('should return a JWT when login is correct', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/login')
      .send({ email: 'testuser@email.com', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user.email).toBe('testuser@email.com');
  });

  it('should return 401 if password is incorrect', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/login')
      .send({ email: 'testuser@email.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Identifiants incorrects');
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/login')
      .send({ email: 'notanemail', password: 'Password123!' });

    expect(res.status).toBe(400);
    expect(res.body.message[0]).toContain("L'email doit être valide");
  });

  it('should return 400 for too short password', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/login')
      .send({ email: 'testuser@email.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.message[0]).toContain('Le mot de passe doit contenir au moins 8 caractères');
  });
});
