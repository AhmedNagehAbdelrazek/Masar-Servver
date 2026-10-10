export type VerificationStatus = 'unverified' | 'pending' | 'rejected' | 'approved';
export declare function canEditVerification(status: string): boolean;
export declare function guardVerificationSubmission(status: string): void;
export declare function computeVerificationStatus(user: {
    verificationStatus: string;
    verificationRejectedAt: Date | null;
}, profile: {
    idVerified: boolean;
} | null, vehicle: {
    isVerified: boolean;
    verificationRejectedAt: Date | null;
} | null): VerificationStatus;
