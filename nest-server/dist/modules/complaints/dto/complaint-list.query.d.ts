import { COMPLAINT_CATEGORIES } from './create-complaint.dto.js';
export declare const COMPLAINT_STATUSES: readonly ["open", "reviewing", "resolved", "dismissed"];
export declare class DriverComplaintListQuery {
    direction?: 'filed' | 'against';
    status?: (typeof COMPLAINT_STATUSES)[number];
    page?: number;
    limit?: number;
}
export declare class AdminComplaintListQuery {
    status?: (typeof COMPLAINT_STATUSES)[number];
    category?: (typeof COMPLAINT_CATEGORIES)[number];
    page?: number;
    limit?: number;
}
