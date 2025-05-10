import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ReactivationRequestModule } from './reactivation-request/reactivationRequest.module';
import { InformationPageModule } from './information/information.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      serveRoot: '/uploads',
      // on pointe vers le dossier 'uploads' à la racine du projet
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
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // uniquement en dev
      }),
    }),
    UserModule,
    AuthenticationModule,
    ReactivationRequestModule,
    InformationPageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
