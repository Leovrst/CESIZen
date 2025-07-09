import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InformationPage } from '../src/entities/information-page.entity';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../src/entities/user.entity';

describe('InformationPageController (e2e)', () => {
  let app: INestApplication;
  let infoRepo: Repository<InformationPage>;
  let userRepo: Repository<User>;
  let jwtToken: string;
  let pageId: string;
  const slug = 'test-page';
  
  const userData = {
    firstName: 'Info',
    lastName: 'Admin',
    email: 'info.admin@email.com',
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

    infoRepo = moduleFixture.get<Repository<InformationPage>>(getRepositoryToken(InformationPage));
    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));

    const password = await bcrypt.hash(userData.password, 10);
    await userRepo.save({ ...userData, password });

    const res = await request(app.getHttpServer())
      .post('/users/login')
      .send({ email: userData.email, password: userData.password });
    jwtToken = res.body.accessToken;
  });

  afterAll(async () => {
    await infoRepo.delete({ slug });
    await userRepo.delete({ email: userData.email });
    await app.close();
  });

  it('should create an information page (admin)', async () => {
    const dto = {
      slug,
      title: 'Ma page test',
      content: 'Voici le contenu.',
    };

    const res = await request(app.getHttpServer())
      .post('/info/admin')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(dto);

    expect([201, 200]).toContain(res.status);
    expect(res.body).toHaveProperty('id');
    expect(res.body.slug).toBe(slug);
    pageId = res.body.id;
  });

  it('should get all information pages (paginated)', async () => {
    const res = await request(app.getHttpServer())
      .get('/info?page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.some((p: any) => p.slug === slug)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
  });

  it('should get one information page by slug', async () => {
    const res = await request(app.getHttpServer())
      .get(`/info/${slug}`);

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(slug);
    expect(res.body.title).toBe('Ma page test');
  });

  it('should update an information page (admin)', async () => {
    const dto = {
      title: 'Page modifiée',
      content: 'Contenu modifié !'
    };
    const res = await request(app.getHttpServer())
      .put(`/info/admin/${pageId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(dto);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Page modifiée');
    expect(res.body.content).toBe('Contenu modifié !');
  });

  it('should remove an information page (admin)', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/info/admin/${pageId}`)
      .set('Authorization', `Bearer ${jwtToken}`);

    expect([200, 204]).toContain(res.status);
  });

  it('should return 404 for a non-existent slug', async () => {
    const res = await request(app.getHttpServer())
      .get('/info/nope-page');

    expect(res.status).toBe(404);
  });

  it('should return 404 for a deleted page', async () => {
    const res = await request(app.getHttpServer())
      .get(`/info/${slug}`);

    expect(res.status).toBe(404);
  });

  it('should not create page without JWT', async () => {
    const dto = { slug: 'no-auth', title: 'No Auth', content: 'Nope' };
    const res = await request(app.getHttpServer())
      .post('/info/admin')
      .send(dto);

    expect(res.status).toBe(401);
  });
});
