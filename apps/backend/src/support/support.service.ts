import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class SupportService {
  private readonly REPO_OWNER = process.env.GITHUB_REPO_OWNER;
  private readonly REPO_NAME = process.env.GITHUB_REPO_NAME;
  private readonly GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  async createTicket(title: string, description: string, type: string): Promise<{ url: string }> {
    if (!this.REPO_OWNER || !this.REPO_NAME || !this.GITHUB_TOKEN) {
      throw new InternalServerErrorException('Configuration Github manquante');
    }
    const response = await fetch(
      `https://api.github.com/repos/${this.REPO_OWNER}/${this.REPO_NAME}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body: description,
          labels: ['support', type]
        })
      }
    );
    const data = await response.json();
    if (response.ok) {
      return { url: data.html_url };
    }
    throw new BadRequestException(data.message || 'Erreur Github', { cause: data });
  }
}
