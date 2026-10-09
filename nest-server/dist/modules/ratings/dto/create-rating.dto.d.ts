export declare class CreateRatingDto {
    booking_id: string;
    stars: number;
    was_late?: boolean;
    late_minutes?: number;
    review?: string;
    tags?: string[];
}
