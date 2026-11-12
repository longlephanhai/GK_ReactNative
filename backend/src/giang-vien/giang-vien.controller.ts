import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGiangVienDto } from './dto/create-giang-vien.dto';
import { QueryGiangVienDto } from './dto/query-giang-vien.dto';
import { UpdateGiangVienDto } from './dto/update-giang-vien.dto';
import { GiangVienService } from './giang-vien.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_IMAGE_MIME = /^image\/(jpeg|jpg|png|webp|gif)$/i;

@UseGuards(JwtAuthGuard)
@Controller('giang-vien')
export class GiangVienController {
  constructor(private readonly giangVienService: GiangVienService) {}

  @Get()
  findAll(@Query() query: QueryGiangVienDto) {
    return this.giangVienService.findAll(query);
  }

  @Get('stats')
  getStats() {
    return this.giangVienService.getStats();
  }

  @Get('export')
  async exportJson(@Res() res: Response) {
    const data = await this.giangVienService.exportCleanJson();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="QLHocPhan.GiangVien.json"',
    );
    return res.send(JSON.stringify(data, null, 2));
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) {
            mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          const extension = extname(file.originalname || '').toLowerCase() || '.jpg';
          cb(null, `gv-${uniqueSuffix}${extension}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME.test(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP hoặc GIF',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh để tải lên');
    }
    return {
      filename: file.filename,
      url: `/uploads/${file.filename}`,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.giangVienService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGiangVienDto) {
    return this.giangVienService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGiangVienDto) {
    return this.giangVienService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.giangVienService.remove(id);
  }
}

