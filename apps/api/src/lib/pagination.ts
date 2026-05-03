import type { PaginationParams, PaginationMeta } from '@votesphere/types';

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function parsePaginationParams(query: Record<string, string>): PaginationParams {
  const page = query.page ? parseInt(query.page, 10) : undefined;
  const parsedLimit = query.limit ? parseInt(query.limit, 10) : DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, parsedLimit), MAX_LIMIT);
  
  return {
    page: page && page > 0 ? page : undefined,
    limit,
    cursor: query.cursor,
    sort: query.sort,
    order: query.order === 'asc' ? 'asc' : 'desc'
  };
}

export function buildPaginationMeta(
  total: number,
  params: PaginationParams,
  nextCursor?: string
): PaginationMeta {
  const meta: PaginationMeta = {};

  if (params.limit !== undefined) {
    meta.limit = params.limit;
  }

  // Offset pagination
  if (params.page !== undefined) {
    meta.page = params.page;
    meta.total = total;
    meta.totalPages = params.limit ? Math.ceil(total / params.limit) : 1;
  }

  // Cursor pagination
  if (nextCursor !== undefined) {
    meta.nextCursor = nextCursor;
  }

  return meta;
}
