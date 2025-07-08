import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { BadRequestException } from '@nestjs/common';

describe('SupportController', () => {
    let controller: SupportController;
    let service: SupportService;

    beforeEach(() => {
        service = {
            createTicket: jest.fn(),
        } as any;
        controller = new SupportController(service);
    });

    it('should call service and return url', async () => {
        const dto = { title: 'Titre', description: 'Desc', type: 'bug' };
        (service.createTicket as jest.Mock).mockResolvedValue({ url: 'mockUrl' });

        const result = await controller.createSupportTicket(dto);
        expect(service.createTicket).toHaveBeenCalledWith('Titre', 'Desc', 'bug');
        expect(result).toEqual({ url: 'mockUrl' });
    });

    it('should throw BadRequestException if fields are missing', async () => {
        const badDtos = [
            { title: '', description: 'desc', type: 'bug' },
            { title: 'titre', description: '', type: 'bug' },
            { title: 'titre', description: 'desc', type: '' },
        ];
        for (const dto of badDtos) {
            await expect(controller.createSupportTicket(dto as any)).rejects.toThrow(BadRequestException);
        }
    });
});
