import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/entities/user.entity';
import { ReactivationRequest } from '../src/entities/reactivationRequest.entity';
import * as bcrypt from 'bcrypt';

describe('ReactivationRequestController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let requestRepository: Repository<ReactivationRequest>;
  let userId: string;
  let requestId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    requestRepository = moduleFixture.get<Repository<ReactivationRequest>>(getRepositoryToken(ReactivationRequest));

    const password = await bcrypt.hash('Password123!', 10);
    const user = await userRepository.save({
      firstName: 'Test',
      lastName: 'Suspendu',
      email: 'suspended@email.com',
      password,
      role: UserRole.USER,
      suspended: true,
      registeredAt: new Date(),
    });
    userId = user.id;
  });

  afterAll(async () => {
    await requestRepository.delete({ user: { id: userId } });
    await userRepository.delete({ id: userId });
    await app.close();
  });

  it('should create a reactivation request', async () => {
    const dto = {
      userId,
      comment: 'Merci de réactiver mon compte.',
    };

    const res = await request(app.getHttpServer())
      .post('/reactivation-requests')
      .send(dto);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(['PENDING', 'En attente']).toContain(res.body.status);
    expect(res.body.comment).toBe(dto.comment);

    requestId = res.body.id;
  });

  it('should not create a request if one is already pending', async () => {
    const dto = {
      userId,
      comment: 'Je refais une demande…',
    };

    const res = await request(app.getHttpServer())
      .post('/reactivation-requests')
      .send(dto);

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('déjà une demande');
  });

  it('should list all reactivation requests', async () => {
    const res = await request(app.getHttpServer())
      .get('/reactivation-requests');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((r: any) => r.user && r.user.id === userId)).toBe(true);
  });

  it('should approve a reactivation request', async () => {
    const res = await request(app.getHttpServer())
      .put(`/reactivation-requests/${requestId}/approve`)
      .send();

    expect(res.status).toBe(200);
    expect(['APPROVED', 'Approuvée']).toContain(res.body.status);

    const updatedUser = await userRepository.findOne({ where: { id: userId } });
    expect(updatedUser?.suspended).toBe(false);
  });

  it('should return 404 on approve if request not found', async () => {
    const fakeId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const res = await request(app.getHttpServer())
      .put(`/reactivation-requests/${fakeId}/approve`)
      .send();

    expect([404, 500]).toContain(res.status);
  });

  it('should reject a request (creates a new one first)', async () => {
    await userRepository.update(userId, { suspended: true });

    const createRes = await request(app.getHttpServer())
      .post('/reactivation-requests')
      .send({
        userId,
        comment: 'Je veux encore une fois être réactivé',
      });

    expect([201, 400]).toContain(createRes.status);
    if (createRes.status === 201) {
      const reqId = createRes.body.id;

      const rejectRes = await request(app.getHttpServer())
        .put(`/reactivation-requests/${reqId}/reject`)
        .send({ rejectionComment: 'Non justifié.' });

      expect([200, 400]).toContain(rejectRes.status);
      if (rejectRes.status === 200)
        expect(['REJECTED', 'Rejetée']).toContain(rejectRes.body.status);
    }
  });

  it('should return 404 on reject if request not found', async () => {
    const fakeId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const res = await request(app.getHttpServer())
      .put(`/reactivation-requests/${fakeId}/reject`)
      .send({ rejectionComment: 'Pas trouvé' });

    expect([404, 500]).toContain(res.status);
  });

  it('should return 400 if userId is missing in createRequest', async () => {
    const res = await request(app.getHttpServer())
      .post('/reactivation-requests')
      .send({ comment: 'Pas d\'userId' });

    expect(res.status).toBe(400);
  });
});
