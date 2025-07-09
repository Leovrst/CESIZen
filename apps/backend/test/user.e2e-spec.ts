import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/entities/user.entity'; 
import * as bcrypt from 'bcrypt';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtToken: string;
  let userId: string;

  const registerDto = {
    firstName: 'Alice',
    lastName: 'Test',
    email: 'alice.user@email.com',
    password: 'testpass123',
    role: 'user'
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await userRepository.delete({ email: registerDto.email });
    await userRepository.delete({ email: 'alice.updated@email.com' });
    await app.close();
  });

  it('should register a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/register')
      .send(registerDto);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(registerDto.email);

    userId = res.body.id;
  });

  it('should not register the same user twice (email unique)', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/register')
      .send(registerDto);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('existe déjà');
  });

  it('should login the user to get a JWT token', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/login')
      .send({ email: registerDto.email, password: registerDto.password });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    jwtToken = res.body.accessToken;
    expect(res.body.user.email).toBe(registerDto.email);
  });

  it('should get all users (secured)', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', 'Bearer ' + jwtToken);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((u: any) => u.email === registerDto.email)).toBe(true);
  });

  it('should get user by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(registerDto.email);
  });

  it('should update the user', async () => {
    const res = await request(app.getHttpServer())
      .put(`/users/${userId}`)
      .send({ firstName: 'AliceUpdated', email: 'alice.updated@email.com' });

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('AliceUpdated');
    expect(res.body.email).toBe('alice.updated@email.com');
  });

  it('should reset the user password', async () => {
    const res = await request(app.getHttpServer())
      .post(`/users/reset-password/${userId}`)
      .send({ newPassword: 'NewTestPass456' });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('réinitialisé');
  });

  it('should login with new password after reset', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/login')
      .send({ email: 'alice.updated@email.com', password: 'NewTestPass456' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should delete the user', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/users/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('supprimé');
  });

  it('should not get deleted user by id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}`);

    expect(res.status).toBe(404);
  });
});
