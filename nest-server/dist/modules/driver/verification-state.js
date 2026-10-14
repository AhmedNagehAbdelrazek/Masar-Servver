import { ConflictException, ForbiddenException } from '@nestjs/common';
export function canEditVerification(status) {
    return status === 'unverified' || status === 'rejected';
}
export function guardVerificationSubmission(status) {
    if (status === 'pending') {
        throw new ConflictException({
            message: 'YOUR_VERIFICATION_APPLICATION_IS_ALREADY_UNDER_REVIEW',
            code: 'CONFLICT',
        });
    }
    if (status === 'approved') {
        throw new ForbiddenException({
            message: 'YOUR_VERIFICATION_IS_APPROVED_AND_LOCKED_CONTACT_SUPPORT_IF_YOU',
            code: 'FORBIDDEN',
        });
    }
}
export function computeVerificationStatus(user, profile, vehicle) {
    if (user.verificationRejectedAt || (vehicle && vehicle.verificationRejectedAt)) {
        return 'rejected';
    }
    const profileVerified = Boolean(profile && profile.idVerified);
    const vehicleVerified = Boolean(vehicle && vehicle.isVerified);
    if (profileVerified && vehicleVerified)
        return 'approved';
    if (user.verificationStatus === 'pending')
        return 'pending';
    if (user.verificationStatus === 'approved')
        return 'approved';
    if (profile || vehicle)
        return 'pending';
    return 'unverified';
}
//# sourceMappingURL=verification-state.js.map