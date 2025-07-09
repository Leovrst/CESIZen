import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class SupportService {
  async createTicket(title: string, description: string, type: string): Promise<{ url: string }> {
    const REPO_OWNER = process.env.GITHUB_REPO_OWNER;
    const REPO_NAME = process.env.GITHUB_REPO_NAME;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    if (!REPO_OWNER || !REPO_NAME || !GITHUB_TOKEN) {
      throw new InternalServerErrorException('Configuration Github manquante');
    }

    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
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

    if (!response) {
      throw new InternalServerErrorException('Problème lors de la requête à GitHub (pas de réponse)');
    }

    let data: any;
    try {
      data = await response.json();
    } catch (e) {
      throw new InternalServerErrorException('Réponse GitHub invalide');
    }

    if (response.ok) {
      return { url: data.html_url };
    }
    throw new BadRequestException(data?.message || 'Erreur Github', { cause: data });
  }
}
