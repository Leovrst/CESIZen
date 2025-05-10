import {
  Controller, Get, Post, Put, Delete,
  Param, Body, UseGuards,
  Query,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { InformationPageService } from './information.service';
import { CreateInformationPageDto } from './dto/create-information-page.dto';
import { UpdateInformationPageDto } from './dto/update-information.dto';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const name = file.originalname
      .toLowerCase()
      .replace(/[\s\/\\]+/g, '-')
      .replace(extname(file.originalname), '');
    const fileExt = extname(file.originalname);
    cb(null, `${name}-${Date.now()}${fileExt}`);
  },
});

@Controller('info')
export class InformationPageController {
    constructor(private svc: InformationPageService) {}

    // consultation publique ou connectée
    @Get()
    getAll(
      @Query('page', ParseIntPipe) page = 1,
      @Query('limit', ParseIntPipe) limit = 20,
    ) {
      return this.svc.findAll({ page, limit });
    }
  
    @Get(':slug')
    getOne(@Param('slug') slug: string) {
      return this.svc.findOneBySlug(slug);
    }

    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor('image', { storage }))
    @Post('admin')
    create(
      @UploadedFile() file: Express.Multer.File,
      @Body() dto: CreateInformationPageDto,
    ) {
      // si Multer a reçu un fichier, stocke file.path
      const imageUrl = file ? `/uploads/${file.filename}` : undefined;
      return this.svc.create({ ...dto, imageUrl });
    }
  
    // CRUD admin (role admin requis)
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FileInterceptor('image', { storage }))
    @Put('admin/:id')
    update(
      @Param('id') id: string,
      @UploadedFile() file: Express.Multer.File,
      @Body() dto: UpdateInformationPageDto,
    ) {
      const imageUrl = file ? `/uploads/${file.filename}` : undefined;
      delete(dto as any).removeImage;
      return this.svc.update(id, { ...dto, imageUrl });
    }
  
    @UseGuards(AuthGuard('jwt'))
    @Delete('admin/:id')
    remove(@Param('id') id: string) {
      return this.svc.remove(id);
    }
}
