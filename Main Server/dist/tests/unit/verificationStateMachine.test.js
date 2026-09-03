"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const { VerificationStatusChange } = require('../../Models');
globals_1.jest.mock('../../Models', () => ({
    User: { findByPk: globals_1.jest.fn(), update: globals_1.jest.fn() },
    DriverProfile: {},
    Vehicle: {},
    UploadedImage: {},
    VerificationStatusChange: { create: globals_1.jest.fn() },
}));
globals_1.jest.mock('../../Services/notificationService', () => ({ sendToUser: globals_1.jest.fn() }));
globals_1.jest.mock('../../Services/auditService', () => ({ track: globals_1.jest.fn() }));
const { canEdit, guardSubmission, computeStatus, } = require('../../Services/driverVerificationService');
const { recordStatusChange } = require('../../Services/verificationService');
const UNVERIFIED = 'unverified';
const PENDING = 'pending';
const REJECTED = 'rejected';
const APPROVED = 'approved';
function makeUser({ status = UNVERIFIED, rejectedAt = null, } = {}) {
    return {
        verificationStatus: status,
        verificationRejectedAt: rejectedAt,
    };
}
function makeProfile(idVerified = false) {
    return idVerified ? { idVerified: true } : { idVerified: false };
}
function makeVehicle(isVerified = false, rejectedAt = null) {
    return { isVerified, verificationRejectedAt: rejectedAt };
}
(0, globals_1.describe)('US1 - verification state machine', () => {
    (0, globals_1.describe)('can_edit rules', () => {
        (0, globals_1.it)('allows editing when unverified or rejected', () => {
            (0, globals_1.expect)(canEdit(UNVERIFIED)).toBe(true);
            (0, globals_1.expect)(canEdit(REJECTED)).toBe(true);
        });
        (0, globals_1.it)('blocks editing when pending or approved', () => {
            (0, globals_1.expect)(canEdit(PENDING)).toBe(false);
            (0, globals_1.expect)(canEdit(APPROVED)).toBe(false);
        });
    });
    (0, globals_1.describe)('guardSubmission', () => {
        (0, globals_1.it)('allows initial submission and resubmission', () => {
            (0, globals_1.expect)(() => guardSubmission(UNVERIFIED)).not.toThrow();
            (0, globals_1.expect)(() => guardSubmission(REJECTED)).not.toThrow();
        });
        (0, globals_1.it)('throws CONFLICT while pending', () => {
            try {
                guardSubmission(PENDING);
                throw new Error('should have thrown');
            }
            catch (err) {
                const e = err;
                (0, globals_1.expect)(e.statusCode).toBe(409);
                (0, globals_1.expect)(e.code).toBe('CONFLICT');
            }
        });
        (0, globals_1.it)('throws FORBIDDEN when approved', () => {
            try {
                guardSubmission(APPROVED);
                throw new Error('should have thrown');
            }
            catch (err) {
                const e = err;
                (0, globals_1.expect)(e.statusCode).toBe(403);
                (0, globals_1.expect)(e.code).toBe('FORBIDDEN');
            }
        });
    });
    (0, globals_1.describe)('computeStatus transitions', () => {
        (0, globals_1.it)('starts unverified with no submission', () => {
            (0, globals_1.expect)(computeStatus(makeUser(), null, null)).toBe(UNVERIFIED);
        });
        (0, globals_1.it)('moves to pending once a profile/vehicle exists', () => {
            (0, globals_1.expect)(computeStatus(makeUser(), makeProfile(), null)).toBe(PENDING);
            (0, globals_1.expect)(computeStatus(makeUser(), null, makeVehicle())).toBe(PENDING);
        });
        (0, globals_1.it)('stays pending while under review', () => {
            (0, globals_1.expect)(computeStatus(makeUser({ status: PENDING }), makeProfile(), makeVehicle())).toBe(PENDING);
        });
        (0, globals_1.it)('approves only when profile and vehicle are both verified', () => {
            (0, globals_1.expect)(computeStatus(makeUser(), makeProfile(true), makeVehicle(true))).toBe(APPROVED);
            (0, globals_1.expect)(computeStatus(makeUser(), makeProfile(false), makeVehicle(true))).toBe(PENDING);
            (0, globals_1.expect)(computeStatus(makeUser(), makeProfile(true), makeVehicle(false))).toBe(PENDING);
        });
        (0, globals_1.it)('stays approved after explicit approval', () => {
            (0, globals_1.expect)(computeStatus(makeUser({ status: APPROVED }), makeProfile(true), makeVehicle(true))).toBe(APPROVED);
        });
        (0, globals_1.it)('rejects when the user was rejected by an admin', () => {
            (0, globals_1.expect)(computeStatus(makeUser({ status: PENDING, rejectedAt: new Date() }), makeProfile(), makeVehicle())).toBe(REJECTED);
        });
        (0, globals_1.it)('rejects when the vehicle was rejected by an admin', () => {
            (0, globals_1.expect)(computeStatus(makeUser({ status: APPROVED }), makeProfile(true), makeVehicle(true, new Date()))).toBe(REJECTED);
        });
    });
});
(0, globals_1.describe)('US9 - recordStatusChange audit rows', () => {
    (0, globals_1.beforeEach)(() => {
        VerificationStatusChange.create.mockReset();
        VerificationStatusChange.create.mockResolvedValue({ id: 'row-1' });
    });
    (0, globals_1.it)('records submit transition unverified -> pending without actor', async () => {
        await recordStatusChange('driver-1', UNVERIFIED, PENDING);
        (0, globals_1.expect)(VerificationStatusChange.create).toHaveBeenCalledWith({
            driverId: 'driver-1',
            fromStatus: UNVERIFIED,
            toStatus: PENDING,
            reason: null,
            markedFields: null,
            changedBy: null,
        }, { transaction: undefined });
    });
    (0, globals_1.it)('records resubmit transition rejected -> pending clearing old rejection', async () => {
        await recordStatusChange('driver-1', REJECTED, PENDING);
        (0, globals_1.expect)(VerificationStatusChange.create).toHaveBeenCalledWith({
            driverId: 'driver-1',
            fromStatus: REJECTED,
            toStatus: PENDING,
            reason: null,
            markedFields: null,
            changedBy: null,
        }, { transaction: undefined });
    });
    (0, globals_1.it)('records approve transition with the acting admin', async () => {
        await recordStatusChange('driver-1', PENDING, APPROVED, { changedBy: 'admin-9' });
        (0, globals_1.expect)(VerificationStatusChange.create).toHaveBeenCalledWith({
            driverId: 'driver-1',
            fromStatus: PENDING,
            toStatus: APPROVED,
            reason: null,
            markedFields: null,
            changedBy: 'admin-9',
        }, { transaction: undefined });
    });
    (0, globals_1.it)('records reject transition with reason and marked fields', async () => {
        await recordStatusChange('driver-1', PENDING, REJECTED, {
            reason: 'Documents illegible',
            markedFields: ['license', 'vehicle_photo'],
            changedBy: 'admin-9',
        });
        (0, globals_1.expect)(VerificationStatusChange.create).toHaveBeenCalledWith({
            driverId: 'driver-1',
            fromStatus: PENDING,
            toStatus: REJECTED,
            reason: 'Documents illegible',
            markedFields: ['license', 'vehicle_photo'],
            changedBy: 'admin-9',
        }, { transaction: undefined });
    });
});
//# sourceMappingURL=verificationStateMachine.test.js.map