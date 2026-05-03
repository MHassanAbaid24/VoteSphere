export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  nextCursor?: string | null;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}
