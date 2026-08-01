const { PAGINATION } = require('../config/constants');

/**
 * Parse and sanitize pagination query params.
 * @returns {{page: number, limit: number, offset: number}}
 */
function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT)
  );
  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Build the pagination metadata object used by list responses.
 */
function buildPagination(total, page, limit) {
  return {
    page,
    limit,
    total,
    total_pages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

module.exports = { parsePagination, buildPagination };
