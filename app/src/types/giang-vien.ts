export interface GiangVien {
  _id: string;
  IDGV: string;
  Fullname: string;
  Image: string;
  SumClass: number;
}

export interface GiangVienPayload {
  IDGV: string;
  Fullname: string;
  Image: string;
  SumClass: number;
}

export interface GiangVienStats {
  totalLecturers: number;
  totalClasses: number;
  avgClasses: number;
  maxClasses: number;
  topLecturer: GiangVien | null;
}

export interface AuthUser {
  username: string;
  role: 'admin';
}

export type SortField = 'IDGV' | 'Fullname' | 'SumClass';
export type SortOrder = 'asc' | 'desc';

export interface QueryParams {
  search?: string;
  sortBy?: SortField;
  order?: SortOrder;
  minSumClass?: number;
  maxSumClass?: number;
}

