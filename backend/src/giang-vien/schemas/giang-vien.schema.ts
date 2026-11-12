import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GiangVienDocument = HydratedDocument<GiangVien>;

/**
 * Mongoose schema strictly mapped to collection `GiangVien` in database `QLHocPhan`.
 * Only the 4 required fields (IDGV, Fullname, Image, SumClass) are stored;
 * versionKey (__v) and timestamps (createdAt, updatedAt) are disabled.
 */
@Schema({
  collection: 'GiangVien',
  versionKey: false,
  timestamps: false,
})
export class GiangVien {
  @Prop({ required: true, unique: true, trim: true })
  IDGV: string;

  @Prop({ required: true, trim: true })
  Fullname: string;

  @Prop({ required: true, trim: true })
  Image: string;

  @Prop({ required: true, min: 0 })
  SumClass: number;
}

export const GiangVienSchema = SchemaFactory.createForClass(GiangVien);

