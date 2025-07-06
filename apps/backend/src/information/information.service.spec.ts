import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { InformationPageService } from './information.service';
import { InformationPage } from '../entities/information-page.entity';
import { CreateInformationPageDto } from './dto/create-information-page.dto';
import { UpdateInformationPageDto } from './dto/update-information.dto';
import { plainToInstance } from 'class-transformer';

type MockRepository<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T extends ObjectLiteral = any>(): MockRepository<T> => ({
  findAndCount: jest.fn(),
  findOneOrFail: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('InformationPageService', () => {
  let service: InformationPageService;
  let repo: MockRepository<InformationPage>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InformationPageService,
        {
          provide: getRepositoryToken(InformationPage),
          useValue: createMockRepository<InformationPage>(),
        },
      ],
    }).compile();

    service = module.get<InformationPageService>(InformationPageService);
    repo = module.get<MockRepository<InformationPage>>(getRepositoryToken(InformationPage));
  });

  describe('findAll', () => {
    it('should return paginated result', async () => {
      const pages = [
        {
          id: '1',
          slug: 'a',
          title: 'A',
          content: 'c',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      repo.findAndCount!.mockResolvedValue([pages, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(repo.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { title: 'ASC' },
      });
      expect(result).toEqual({ items: pages, total: 1, page: 1, limit: 10 });
    });
  });

  describe('findOneBySlug', () => {
    it('should return a page if found', async () => {
      const page = {
        id: '1',
        slug: 'test',
        title: 'Test',
        content: 'c',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repo.findOneOrFail!.mockResolvedValue(page);

      await expect(service.findOneBySlug('test')).resolves.toEqual(page);
      expect(repo.findOneOrFail).toHaveBeenCalledWith({ where: { slug: 'test' } });
    });

    it('should throw NotFoundException if not found', async () => {
      repo.findOneOrFail!.mockRejectedValue(new Error());
      await expect(service.findOneBySlug('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and save a page', async () => {
      const dto: CreateInformationPageDto = { slug: 's', title: 'T', content: 'C', videoUrl: undefined } as any;
      const entity = { ...dto } as InformationPage;
      repo.create!.mockReturnValue(entity);
      repo.save!.mockResolvedValue(entity);

      const result = await service.create(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('should update and return updated page', async () => {
      const dto = plainToInstance(UpdateInformationPageDto, { title: 'New' });
      const updated = {
        id: '1',
        slug: 's',
        title: 'New',
        content: 'C',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repo.update!.mockResolvedValue(undefined as any);
      repo.findOneOrFail!.mockResolvedValue(updated);

      await expect(service.update('1', dto)).resolves.toEqual(updated);
      expect(repo.update).toHaveBeenCalledWith('1', dto);
      expect(repo.findOneOrFail).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('remove', () => {
    it('should delete if found', async () => {
      repo.delete!.mockResolvedValue({ affected: 1 } as any);
      await expect(service.remove('1')).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if no record deleted', async () => {
      repo.delete!.mockResolvedValue({ affected: 0 } as any);
      await expect(service.remove('1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});