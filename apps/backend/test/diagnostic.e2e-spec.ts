import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { IsNull, Not, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/entities/user.entity';
import { DiagnosticQuestion } from '../src/entities/diagnostic-question.entity';
import { DiagnosticResult } from '../src/entities/diagnostic-result.entity';
import { UserDiagnosticResult } from '../src/entities/user-diagnostic-result';
import * as bcrypt from 'bcrypt';

describe('DiagnosticController (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let questionRepo: Repository<DiagnosticQuestion>;
  let resultRepo: Repository<DiagnosticResult>;
  let userResultRepo: Repository<UserDiagnosticResult>;
  let jwtToken: string;
  let userId: string;

  const adminUser = {
    firstName: 'Diag',
    lastName: 'Admin',
    email: 'diag.admin@email.com',
    password: 'Password123!',
    role: UserRole.ADMIN,
    suspended: false,
    registeredAt: new Date()
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    questionRepo = moduleFixture.get<Repository<DiagnosticQuestion>>(getRepositoryToken(DiagnosticQuestion));
    resultRepo = moduleFixture.get<Repository<DiagnosticResult>>(getRepositoryToken(DiagnosticResult));
    userResultRepo = moduleFixture.get<Repository<UserDiagnosticResult>>(getRepositoryToken(UserDiagnosticResult));

    await userResultRepo.delete({ id: Not(IsNull()) });
    await questionRepo.delete({ id: Not(IsNull()) });
    await resultRepo.delete({ id: Not(IsNull()) });

    const password = await bcrypt.hash(adminUser.password, 10);
    const user = await userRepo.save({ ...adminUser, password });
    userId = user.id;

    const res = await request(app.getHttpServer())
      .post('/users/login')
      .send({ email: adminUser.email, password: adminUser.password });
    jwtToken = res.body.accessToken;
  });

  afterAll(async () => {
    await userResultRepo.delete({ id: Not(IsNull()) });
    await questionRepo.delete({ id: Not(IsNull()) });
    await resultRepo.delete({ id: Not(IsNull()) });
    await userRepo.delete({ email: adminUser.email });
    await app.close();
  });

  it('should create/update/get/delete a diagnostic question (admin)', async () => {
    const createDto = { label: 'Combien de cafés par jour ?', points: '2' };
    const createRes = await request(app.getHttpServer())
      .post('/diagnostic/admin/questions')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(createDto);

    expect([201, 200]).toContain(createRes.status);
    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body.label).toBe(createDto.label);
    const questionId = createRes.body.id;

    const updateDto = { label: 'Combien de thés par jour ?', points: '3' };
    const updateRes = await request(app.getHttpServer())
      .patch(`/diagnostic/admin/questions/${questionId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(updateDto);

    expect([200, 201]).toContain(updateRes.status);
    expect(updateRes.body.label).toBe(updateDto.label);
    expect(String(updateRes.body.points)).toBe(updateDto.points);

    const getRes = await request(app.getHttpServer())
      .get('/diagnostic/questions');
    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
    expect(getRes.body.some((q: any) => q.id === questionId)).toBe(true);

    const delRes = await request(app.getHttpServer())
      .delete(`/diagnostic/admin/questions/${questionId}`)
      .set('Authorization', `Bearer ${jwtToken}`);
    expect([200, 201]).toContain(delRes.status);
    expect(delRes.body.ok).toBe(true);
  });

  it('should create/update/get/delete a diagnostic result (admin)', async () => {
    const createDto = {
      title: 'Bon équilibre',
      minScore: 0,
      maxScore: 5,
      message: 'Tout va bien !'
    };
    const createRes = await request(app.getHttpServer())
      .post('/diagnostic/admin/results')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(createDto);

    expect([200, 201]).toContain(createRes.status);
    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body.title).toBe(createDto.title);
    const resultId = createRes.body.id;

    const updateDto = { title: 'Moyen équilibre', message: 'Bof bof' };
    const updateRes = await request(app.getHttpServer())
      .patch(`/diagnostic/admin/results/${resultId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(updateDto);

    expect([200, 201]).toContain(updateRes.status);
    expect(updateRes.body.title).toBe(updateDto.title);
    expect(updateRes.body.message).toBe(updateDto.message);

    const getRes = await request(app.getHttpServer())
      .get('/diagnostic/results-config');
    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
    expect(getRes.body.some((r: any) => r.id === resultId)).toBe(true);

    const delRes = await request(app.getHttpServer())
      .delete(`/diagnostic/admin/results/${resultId}`)
      .set('Authorization', `Bearer ${jwtToken}`);
    expect([200, 201]).toContain(delRes.status);
    expect(delRes.body.ok).toBe(true);
  });

  it('should evaluate a score anonymously and as user', async () => {
    const resultDto = {
      title: 'Plage score',
      minScore: 0,
      maxScore: 10,
      message: 'Bravo !'
    };
    const createRes = await request(app.getHttpServer())
      .post('/diagnostic/admin/results')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(resultDto);
    expect([200, 201]).toContain(createRes.status);
    const resultId = createRes.body.id;

    const anonEval = await request(app.getHttpServer())
      .get('/diagnostic/evaluate?score=5');
    expect(anonEval.status).toBe(200);
    expect(anonEval.body.score).toBe(5);
    expect(anonEval.body.result.id).toBe(resultId);

    const userEval = await request(app.getHttpServer())
      .get('/diagnostic/evaluate?score=6')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(userEval.status).toBe(200);
    expect(userEval.body.score).toBe(6);
    expect(userEval.body.result.id).toBe(resultId);

    const getUserResult = await request(app.getHttpServer())
      .get('/diagnostic/user-result')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(getUserResult.status).toBe(404);

    const clearRes = await request(app.getHttpServer())
      .delete('/diagnostic/user-result')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.ok).toBe(true);

    const getCleared = await request(app.getHttpServer())
      .get('/diagnostic/user-result')
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(getCleared.status).toBe(404);

    await request(app.getHttpServer())
      .delete(`/diagnostic/admin/results/${resultId}`)
      .set('Authorization', `Bearer ${jwtToken}`);
  });

  it('should return 404 if score does not match any diagnostic result', async () => {
    const res = await request(app.getHttpServer())
      .get('/diagnostic/evaluate?score=123');
    expect(res.status).toBe(404);
  });
});
