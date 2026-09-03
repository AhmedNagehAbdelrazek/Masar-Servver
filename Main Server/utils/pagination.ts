import { PAGINATION } from '../config/constants';

export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

export interface ParsedPagination {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Parse and sanitize pagination query params.
 */
export function parsePagination(query: PaginationQuery = {}): ParsedPagination {
  const page: number = Math.max(1, parseInt(String(query.page), 10) || PAGINATION.DEFAULT_PAGE);
  const limit: number = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit), 10) || PAGINATION.DEFAULT_LIMIT)
  );
  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Build the pagination metadata object used by list responses.
 */
export function buildPagination(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    total_pages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

const pagination = { parsePagination, buildPagination };
export default pagination;

// CommonJS interop
// @ts-ignore
if (typeof module !== 'undefined' && module.exports) {
  // @ts-ignore
  module.exports = { parsePagination, buildPagination };
  // @ts-ignore
  module.exports.parsePagination = parsePagination;
  // @ts-ignore
  module.exports.buildPagination = buildPagination;
  // @ts-ignore
  module.exports.default = pagination;
}
