export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
export declare function parsePagination(query: {
    page?: unknown;
    limit?: unknown;
}): {
    page: number;
    limit: number;
    offset: number;
};
export declare function buildPagination(total: number, page: number, limit: number): {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
};
