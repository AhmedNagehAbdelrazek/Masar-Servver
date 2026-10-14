export declare class UpdatePlanDto {
    name?: string;
    period_days?: number;
    percentage_cut?: number;
    cost?: number;
    status?: string | null;
    features?: string[];
    is_free?: boolean;
    free_offer?: {
        type: string;
        value: number;
    } | null;
    is_active?: boolean;
}
