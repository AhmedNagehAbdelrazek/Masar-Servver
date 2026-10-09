export declare class CreatePlanDto {
    name: string;
    period_days: number;
    percentage_cut?: number;
    cost?: number;
    status?: string | null;
    features?: string[];
    is_free?: boolean;
    free_offer?: {
        type: string;
        value: number;
    } | null;
}
