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

@Module({
  imports: [
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
        ],
        synchronize: true, // uniquement en dev
      }),
    }),
    UserModule,
    AuthenticationModule,
    ReactivationRequestModule,
    DiagnosticModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
