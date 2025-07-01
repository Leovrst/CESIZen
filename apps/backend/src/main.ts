import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: (req, res) => {
      res.status(429).json({
        statusCode: 429,
        message: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.',
        error: 'Too Many Requests',
      });
    },
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:8100'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  app.use('/users/login', loginRateLimiter);
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
