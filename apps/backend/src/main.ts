import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { ThrottlerGuard } from '@nestjs/throttler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:8100',
      'https://cesi-zen-mobile.vercel.app',
    ],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://trusted.cdn.com'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    }),
  );
  app.use((req, res, next) => {
    if (
      process.env.NODE_ENV === 'production' &&
      req.headers['x-forwarded-proto'] !== 'https'
    ) {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
  const backend = app.getHttpAdapter().getInstance();
  backend.set('trust proxy', 1);
  await app.listen(process.env.PORT ?? 3000, () => { });
}
bootstrap();
