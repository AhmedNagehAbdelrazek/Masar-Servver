"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.buildPagination = buildPagination;
const constants_1 = require("../config/constants");
/**
 * Parse and sanitize pagination query params.
 */
function parsePagination(query = {}) {
    const page = Math.max(1, parseInt(String(query.page), 10) || constants_1.PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(constants_1.PAGINATION.MAX_LIMIT, Math.max(1, parseInt(String(query.limit), 10) || constants_1.PAGINATION.DEFAULT_LIMIT));
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
const pagination = { parsePagination, buildPagination };
exports.default = pagination;
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
//# sourceMappingURL=pagination.js.map