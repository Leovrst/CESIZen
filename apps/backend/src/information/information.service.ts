import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InformationPage } from '../entities/information-page.entity';
import { CreateInformationPageDto } from './dto/create-information-page.dto';
import { UpdateInformationPageDto } from './dto/update-information.dto';
import { PaginationOptions, PaginatedResult } from './dto/pagination.interface';

@Injectable()
export class InformationPageService {
  constructor(
    @InjectRepository(InformationPage)
    private repo: Repository<InformationPage>,
  ) {}

  async findAll(
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<InformationPage>> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 20;
    const [items, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { title: 'ASC' },
    });
    return { items, total, page, limit };
  }

  async findOneBySlug(slug: string) {
    try {
      return await this.repo.findOneOrFail({ where: { slug } });
    } catch {
      throw new NotFoundException(`Page d'information “${slug}” introuvable`);
    }
  }

  create(
    dto: CreateInformationPageDto & { imageUrl?: string },
  ): Promise<InformationPage> {
    const page = this.repo.create(dto);
    return this.repo.save(page);
  }

  async update(
    id: string,
    dto: UpdateInformationPageDto & { imageUrl?: string },
  ): Promise<InformationPage> {
    await this.repo.update(id, dto);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Page d'information avec l'ID “${id}” introuvable`,
      );
    }
  }
}
