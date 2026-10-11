export interface FreeOffer {
    type?: string;
    value?: number | string;
    max?: number | string;
}
export declare function getFreeOffer(sub: unknown): FreeOffer | null;
export declare function hasFreeTripsOffer(sub: unknown): boolean;
export declare function freeTripsLimit(sub: unknown): number;
