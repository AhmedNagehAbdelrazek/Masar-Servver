declare class PaginationQuery {
    page?: number;
    limit?: number;
}
export declare class RecentTripsQuery extends PaginationQuery {
    status?: string;
}
export declare class DriversListQuery extends PaginationQuery {
    search?: string;
    status?: string;
    registration_from?: string;
    registration_to?: string;
    sort_by?: string;
    sort_order?: string;
}
export declare class DriverTripsQuery extends PaginationQuery {
    status?: string;
    month?: string;
}
export declare class ReservationsQuery extends PaginationQuery {
    status?: string;
}
export {};
