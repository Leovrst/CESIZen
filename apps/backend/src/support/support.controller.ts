import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  async createSupportTicket(@Body() dto: CreateSupportTicketDto) {
    const { title, description, type } = dto;
    if (!title || !description || !type) {
      throw new BadRequestException('Champs manquants');
    }
    return await this.supportService.createTicket(title, description, type);
  }
}
