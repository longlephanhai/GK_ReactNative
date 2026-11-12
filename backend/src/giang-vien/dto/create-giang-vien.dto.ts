import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateGiangVienDto {
  @IsString({ message: 'IDGV phải là chuỗi' })
  @IsNotEmpty({ message: 'Mã giảng viên (IDGV) không được để trống' })
  @MaxLength(50, { message: 'IDGV tối đa 50 ký tự' })
  IDGV: string;

  @IsString({ message: 'Fullname phải là chuỗi' })
  @IsNotEmpty({ message: 'Họ và tên (Fullname) không được để trống' })
  @MaxLength(150, { message: 'Họ và tên tối đa 150 ký tự' })
  Fullname: string;

  @IsString({ message: 'Image phải là chuỗi' })
  @IsNotEmpty({ message: 'Hình ảnh (Image) không được để trống' })
  Image: string;

  @Type(() => Number)
  @IsInt({ message: 'Tổng số lớp (SumClass) phải là số nguyên' })
  @Min(0, { message: 'Tổng số lớp (SumClass) phải >= 0' })
  SumClass: number;
}

