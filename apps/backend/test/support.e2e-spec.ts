import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

jest.mock('node-fetch');
import fetch from 'node-fetch';
const fetchMock = fetch as unknown as jest.Mock;

describe('SupportController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.GITHUB_REPO_OWNER = 'fake-owner';
    process.env.GITHUB_REPO_NAME = 'fake-repo';
    process.env.GITHUB_TOKEN = 'fake-token';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('should create a support ticket', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        html_url: 'https://github.com/fake-owner/fake-repo/issues/1'
      }),
    } as any);

    const dto = {
      title: 'Problème urgent',
      description: 'Je rencontre un bug bloquant',
      type: 'bug'
    };

    const res = await request(app.getHttpServer())
      .post('/support')
      .send(dto);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('url');
    expect(res.body.url).toContain('github.com');
    expect(fetchMock).toHaveBeenCalled();
  });

  it('should return 400 if a field is missing', async () => {
    const dto = {
      title: 'Manque le type',
      description: 'Pas de type',
    };

    const res = await request(app.getHttpServer())
      .post('/support')
      .send(dto);

    expect(res.status).toBe(400);
  });

  it('should return 400 if GitHub returns error', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: 'Erreur GitHub'
      }),
    } as any);

    const dto = {
      title: 'Test erreur',
      description: 'Erreur côté GitHub',
      type: 'question'
    };

    const res = await request(app.getHttpServer())
      .post('/support')
      .send(dto);

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('Erreur GitHub');
  });

  it('should return 500 if configuration GitHub manquante', async () => {
    process.env.GITHUB_REPO_OWNER = '';
    process.env.GITHUB_REPO_NAME = '';
    process.env.GITHUB_TOKEN = '';

    const dto = {
      title: 'Test config',
      description: 'Pas de config',
      type: 'incident'
    };

    const res = await request(app.getHttpServer())
      .post('/support')
      .send(dto);

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).toContain('Configuration Github manquante');

    process.env.GITHUB_REPO_OWNER = 'fake-owner';
    process.env.GITHUB_REPO_NAME = 'fake-repo';
    process.env.GITHUB_TOKEN = 'fake-token';
  });
});
