jest.mock('node-fetch', () => ({
    __esModule: true,
    default: jest.fn(),
}));

import fetch from 'node-fetch';
import { SupportService } from './support.service';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';

const mockedFetch = fetch as jest.Mock;

describe('SupportService', () => {
    let service: SupportService;

    beforeEach(() => {
        process.env.GITHUB_REPO_OWNER = 'testOwner';
        process.env.GITHUB_REPO_NAME = 'testRepo';
        process.env.GITHUB_TOKEN = 'testToken';
        service = new SupportService();
        mockedFetch.mockReset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a ticket and return the url', async () => {
        mockedFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ html_url: 'https://github.com/issue-url' }),
        });

        const result = await service.createTicket('titre', 'desc', 'bug');
        expect(result).toEqual({ url: 'https://github.com/issue-url' });

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringContaining('/issues'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: expect.stringContaining('Bearer'),
                }),
                body: expect.stringContaining('titre'),
            }),
        );
    });

    it('should throw InternalServerErrorException if config missing', async () => {
        process.env.GITHUB_REPO_OWNER = '';
        service = new SupportService();
        await expect(service.createTicket('titre', 'desc', 'bug')).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw BadRequestException if Github returns error', async () => {
        mockedFetch.mockResolvedValue({
            ok: false,
            json: async () => ({ message: 'error github' }),
        });

        await expect(service.createTicket('titre', 'desc', 'bug')).rejects.toThrow(BadRequestException);
    });
});
