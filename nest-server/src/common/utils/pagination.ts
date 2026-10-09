// Port of Main Server/utils/pagination.ts
export const PAGINATION = { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20, MAX_LIMIT: 100 } as const;

export function parsePagination(query: { page?: unknown; limit?: unknown }): {
  page: number;
  limit: number;
  offset: number;
} {
  const rawPage = Number(query.page ?? PAGINATION.DEFAULT_PAGE);
  const rawLimit = Number(query.limit ?? PAGINATION.DEFAULT_LIMIT);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : PAGINATION.DEFAULT_PAGE;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.floor(rawLimit), 1), PAGINATION.MAX_LIMIT)
    : PAGINATION.DEFAULT_LIMIT;
  return { page, limit, offset: (page - 1) * limit };
}

export function buildPagination(total: number, page: number, limit: number): {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
} {
  return { page, limit, total, total_pages: total === 0 ? 0 : Math.ceil(total / limit) };
}
