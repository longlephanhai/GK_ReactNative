import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryGiangVienDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['IDGV', 'Fullname', 'SumClass'])
  sortBy?: 'IDGV' | 'Fullname' | 'SumClass';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minSumClass?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxSumClass?: number;
}

