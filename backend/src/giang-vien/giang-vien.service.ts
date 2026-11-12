import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateGiangVienDto } from './dto/create-giang-vien.dto';
import { QueryGiangVienDto } from './dto/query-giang-vien.dto';
import { UpdateGiangVienDto } from './dto/update-giang-vien.dto';
import { GiangVien, GiangVienDocument } from './schemas/giang-vien.schema';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class GiangVienService {
  constructor(
    @InjectModel(GiangVien.name)
    private readonly giangVienModel: Model<GiangVienDocument>,
  ) {}

  async findAll(query: QueryGiangVienDto) {
    const filter: Record<string, unknown> = {};

    if (query.search?.trim()) {
      const pattern = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [{ IDGV: pattern }, { Fullname: pattern }];
    }

    if (query.minSumClass !== undefined || query.maxSumClass !== undefined) {
      const sumFilter: Record<string, number> = {};
      if (query.minSumClass !== undefined) {
        sumFilter.$gte = query.minSumClass;
      }
      if (query.maxSumClass !== undefined) {
        sumFilter.$lte = query.maxSumClass;
      }
      filter.SumClass = sumFilter;
    }

    const sortField = query.sortBy ?? 'IDGV';
    const sortDir = query.order === 'desc' ? -1 : 1;

    return this.giangVienModel
      .find(filter)
      .sort({ [sortField]: sortDir })
      .lean()
      .exec();
  }

  async getStats() {
    const list = await this.giangVienModel
      .find()
      .select({ IDGV: 1, Fullname: 1, Image: 1, SumClass: 1 })
      .lean()
      .exec();

    const totalLecturers = list.length;
    if (totalLecturers === 0) {
      return {
        totalLecturers: 0,
        totalClasses: 0,
        avgClasses: 0,
        maxClasses: 0,
        topLecturer: null,
      };
    }

    let totalClasses = 0;
    let topLecturer = list[0];

    for (const item of list) {
      totalClasses += item.SumClass;
      if (item.SumClass > topLecturer.SumClass) {
        topLecturer = item;
      }
    }

    return {
      totalLecturers,
      totalClasses,
      avgClasses: Number((totalClasses / totalLecturers).toFixed(2)),
      maxClasses: topLecturer.SumClass,
      topLecturer,
    };
  }

  async exportCleanJson() {
    return this.giangVienModel
      .find()
      .select({ _id: 0, IDGV: 1, Fullname: 1, Image: 1, SumClass: 1 })
      .sort({ IDGV: 1 })
      .lean()
      .exec();
  }

  async findOne(id: string) {
    this.ensureValidId(id);
    const doc = await this.giangVienModel.findById(id).lean().exec();
    if (!doc) {
      throw new NotFoundException('Không tìm thấy giảng viên');
    }
    return doc;
  }

  async create(dto: CreateGiangVienDto) {
    const normalizedIdgv = dto.IDGV.trim();
    const existing = await this.giangVienModel
      .exists({ IDGV: normalizedIdgv })
      .exec();
    if (existing) {
      throw new ConflictException(
        `Mã giảng viên "${normalizedIdgv}" đã tồn tại`,
      );
    }

    const created = await this.giangVienModel.create({
      IDGV: normalizedIdgv,
      Fullname: dto.Fullname.trim(),
      Image: dto.Image.trim(),
      SumClass: dto.SumClass,
    });

    return created.toObject();
  }

  async update(id: string, dto: UpdateGiangVienDto) {
    this.ensureValidId(id);

    const payload: Partial<GiangVien> = {};
    if (dto.IDGV !== undefined) {
      const normalizedIdgv = dto.IDGV.trim();
      const duplicate = await this.giangVienModel
        .findOne({ IDGV: normalizedIdgv, _id: { $ne: id } })
        .select({ _id: 1 })
        .lean()
        .exec();
      if (duplicate) {
        throw new ConflictException(
          `Mã giảng viên "${normalizedIdgv}" đã tồn tại`,
        );
      }
      payload.IDGV = normalizedIdgv;
    }
    if (dto.Fullname !== undefined) {
      payload.Fullname = dto.Fullname.trim();
    }
    if (dto.Image !== undefined) {
      payload.Image = dto.Image.trim();
    }
    if (dto.SumClass !== undefined) {
      payload.SumClass = dto.SumClass;
    }

    const updated = await this.giangVienModel
      .findByIdAndUpdate(id, { $set: payload }, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy giảng viên để cập nhật');
    }

    return updated;
  }

  async remove(id: string) {
    this.ensureValidId(id);
    const deleted = await this.giangVienModel.findByIdAndDelete(id).lean().exec();
    if (!deleted) {
      throw new NotFoundException('Không tìm thấy giảng viên để xóa');
    }
    return { deleted: true, _id: id, IDGV: deleted.IDGV };
  }

  private ensureValidId(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID bản ghi không hợp lệ');
    }
  }
}

