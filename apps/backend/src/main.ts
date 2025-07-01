import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:8100'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  app.use('/users/login', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Trop de tentatives de connexion. Réessayez plus tard.',
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
