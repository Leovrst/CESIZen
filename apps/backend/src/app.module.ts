import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ReactivationRequestModule } from './reactivation-request/reactivationRequest.module';
import { DiagnosticModule } from './diagnostic/diagnostic.module';
import { User } from './entities/user.entity';
import { DiagnosticQuestion } from './entities/diagnostic-question.entity';
import { DiagnosticResult } from './entities/diagnostic-result.entity';
import { UserDiagnosticResult } from './entities/user-diagnostic-result';
import { ReactivationRequest } from './entities/reactivationRequest.entity';
import { InformationPageModule } from './information/information.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { InformationPage } from './entities/information-page.entity';
import { SupportModule } from './support/support.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 10,
        },
      ],
    }),
    ServeStaticModule.forRoot({
      serveRoot: '/uploads',
      rootPath: join(process.cwd(), 'uploads'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          User,
          DiagnosticQuestion,
          DiagnosticResult,
          UserDiagnosticResult,
          ReactivationRequest,
          InformationPage,
        ],
        synchronize: true,
      }),
    }),
    UserModule,
    AuthenticationModule,
    ReactivationRequestModule,
    DiagnosticModule,
    InformationPageModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
