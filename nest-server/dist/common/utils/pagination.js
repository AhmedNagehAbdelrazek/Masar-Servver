export const PAGINATION = { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20, MAX_LIMIT: 100 };
export function parsePagination(query) {
    const rawPage = Number(query.page ?? PAGINATION.DEFAULT_PAGE);
    const rawLimit = Number(query.limit ?? PAGINATION.DEFAULT_LIMIT);
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : PAGINATION.DEFAULT_PAGE;
    const limit = Number.isFinite(rawLimit)
        ? Math.min(Math.max(Math.floor(rawLimit), 1), PAGINATION.MAX_LIMIT)
        : PAGINATION.DEFAULT_LIMIT;
    return { page, limit, offset: (page - 1) * limit };
}
export function buildPagination(total, page, limit) {
    return { page, limit, total, total_pages: total === 0 ? 0 : Math.ceil(total / limit) };
}
//# sourceMappingURL=pagination.js.map