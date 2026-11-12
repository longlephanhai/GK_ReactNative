import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GiangVienController } from './giang-vien.controller';
import { GiangVienService } from './giang-vien.service';
import { GiangVien, GiangVienSchema } from './schemas/giang-vien.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GiangVien.name, schema: GiangVienSchema },
    ]),
  ],
  controllers: [GiangVienController],
  providers: [GiangVienService],
})
export class GiangVienModule {}

