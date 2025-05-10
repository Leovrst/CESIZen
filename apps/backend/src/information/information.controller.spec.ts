import { InformationPageController } from './information.controller';
import { InformationPageService } from './information.service';
import { CreateInformationPageDto } from './dto/create-information-page.dto';
import { UpdateInformationPageDto } from './dto/update-information.dto';

describe('InformationPageController', () => {
  let controller: InformationPageController;
  let service: jest.Mocked<InformationPageService>;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findOneBySlug: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;
    controller = new InformationPageController(service);
  });

  describe('getAll', () => {
    it('should return paginated results with provided query params', async () => {
      const expected = [{ title: 'Page 1' }];
      service.findAll.mockResolvedValue(expected as any);

      const result = await controller.getAll(2, 5);
      expect(service.findAll).toHaveBeenCalledWith({ page: 2, limit: 5 });
      expect(result).toBe(expected);
    });

    it('should use default values when query params are not provided', async () => {
      service.findAll.mockResolvedValue([] as any);

      await controller.getAll(undefined as any, undefined as any);
      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  describe('getOne', () => {
    it('should return a single page by slug', async () => {
      const slug = 'test-slug';
      const expected = { title: 'Test' };
      service.findOneBySlug.mockResolvedValue(expected as any);

      const result = await controller.getOne(slug);
      expect(service.findOneBySlug).toHaveBeenCalledWith(slug);
      expect(result).toBe(expected);
    });
  });

  describe('create', () => {
    it('should call service.create with imageUrl when file is provided', async () => {
      const file = { filename: 'img.png' } as Express.Multer.File;
      const dto: CreateInformationPageDto = { title: 'New', content: 'Content', slug: 'new-page' };
      const expected = { id: '1', ...dto, imageUrl: '/uploads/img.png' };
      service.create.mockResolvedValue(expected as any);

      const result = await controller.create(file, dto);
      expect(service.create).toHaveBeenCalledWith({ ...dto, imageUrl: '/uploads/img.png' });
      expect(result).toBe(expected);
    });

    it('should call service.create without imageUrl when no file is provided', async () => {
      const dto: CreateInformationPageDto = { title: 'NoImage', content: 'Empty', slug: 'no-image' };
      service.create.mockResolvedValue({} as any);

      const result = await controller.create(undefined as any, dto);
      expect(service.create).toHaveBeenCalledWith({ ...dto, imageUrl: undefined });
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should call service.update with imageUrl when file is provided', async () => {
      const id = '123';
      const file = { filename: 'update.png' } as Express.Multer.File;
      const dto: UpdateInformationPageDto & { removeImage?: boolean } = { title: 'Up', content: 'Content', removeImage: true };
      const expected = { id, title: 'Up', content: 'Content', imageUrl: '/uploads/update.png' };
      service.update.mockResolvedValue(expected as any);

      const result = await controller.update(id, file, dto);
      expect(service.update).toHaveBeenCalledWith(id, { title: 'Up', content: 'Content', imageUrl: '/uploads/update.png' });
      expect(result).toBe(expected);
    });

    it('should call service.update without imageUrl when no file is provided', async () => {
      const id = '456';
      const dto: UpdateInformationPageDto = { title: 'NoFile', content: 'Text' };
      service.update.mockResolvedValue({} as any);

      const result = await controller.update(id, undefined as any, dto);
      expect(service.update).toHaveBeenCalledWith(id, { ...dto, imageUrl: undefined });
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should call service.remove with the correct id', async () => {
      const id = '789';
      service.remove.mockResolvedValue({ deleted: true } as any);

      const result = await controller.remove(id);
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual({ deleted: true });
    });
  });
});
