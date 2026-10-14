export declare const COMPLAINT_CATEGORIES: readonly ["no_show", "lateness", "misconduct", "fraud", "safety", "overcharging", "other"];
export declare class CreateComplaintDto {
    accused_id: string;
    booking_id?: string;
    category: (typeof COMPLAINT_CATEGORIES)[number];
    description: string;
    evidence_urls?: string[];
}
