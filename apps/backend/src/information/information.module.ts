import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InformationPageService } from './information.service';
import { InformationPageController } from './information.controller';
import { InformationPage } from '../entities/information-page.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InformationPage])],
  providers: [InformationPageService],
  controllers: [InformationPageController],
})
export class InformationPageModule {}
