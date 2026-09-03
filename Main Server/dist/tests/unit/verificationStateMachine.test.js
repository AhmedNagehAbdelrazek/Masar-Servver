"use strict";
const { VerificationStatusChange, } = require('../../Models');
jest.mock('../../Models', () => ({
    User: { findByPk: jest.fn(), update: jest.fn() },
    DriverProfile: {},
    Vehicle: {},
    UploadedImage: {},
    VerificationStatusChange: { create: jest.fn() },
}));
jest.mock('../../Services/notificationService', () => ({ sendToUser: jest.fn() }));
jest.mock('../../Services/auditService', () => ({ track: jest.fn() }));
const { canEdit, guardSubmission, computeStatus, } = require('../../Services/driverVerificationService');
const { recordStatusChange } = require('../../Services/verificationService');
const UNVERIFIED = 'unverified';
const PENDING = 'pending';
const REJECTED = 'rejected';
const APPROVED = 'approved';
function makeUser({ status = UNVERIFIED, rejectedAt = null } = {}) {
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
describe('US1 - verification state machine', () => {
    describe('can_edit rules', () => {
        it('allows editing when unverified or rejected', () => {
            expect(canEdit(UNVERIFIED)).toBe(true);
            expect(canEdit(REJECTED)).toBe(true);
        });
        it('blocks editing when pending or approved', () => {
            expect(canEdit(PENDING)).toBe(false);
            expect(canEdit(APPROVED)).toBe(false);
        });
    });
    describe('guardSubmission', () => {
        it('allows initial submission and resubmission', () => {
            expect(() => guardSubmission(UNVERIFIED)).not.toThrow();
            expect(() => guardSubmission(REJECTED)).not.toThrow();
        });
        it('throws CONFLICT while pending', () => {
            try {
                guardSubmission(PENDING);
                throw new Error('should have thrown');
            }
            catch (err) {
                expect(err.statusCode).toBe(409);
                expect(err.code).toBe('CONFLICT');
            }
        });
        it('throws FORBIDDEN when approved', () => {
            try {
                guardSubmission(APPROVED);
                throw new Error('should have thrown');
            }
            catch (err) {
                expect(err.statusCode).toBe(403);
                expect(err.code).toBe('FORBIDDEN');
            }
        });
    });
    describe('computeStatus transitions', () => {
        it('starts unverified with no submission', () => {
            expect(computeStatus(makeUser(), null, null)).toBe(UNVERIFIED);
        });
        it('moves to pending once a profile/vehicle exists', () => {
            expect(computeStatus(makeUser(), makeProfile(), null)).toBe(PENDING);
            expect(computeStatus(makeUser(), null, makeVehicle())).toBe(PENDING);
        });
        it('stays pending while under review', () => {
            expect(computeStatus(makeUser({ status: PENDING }), makeProfile(), makeVehicle())).toBe(PENDING);
        });
        it('approves only when profile and vehicle are both verified', () => {
            expect(computeStatus(makeUser(), makeProfile(true), makeVehicle(true))).toBe(APPROVED);
            expect(computeStatus(makeUser(), makeProfile(false), makeVehicle(true))).toBe(PENDING);
            expect(computeStatus(makeUser(), makeProfile(true), makeVehicle(false))).toBe(PENDING);
        });
        it('stays approved after explicit approval', () => {
            expect(computeStatus(makeUser({ status: APPROVED }), makeProfile(true), makeVehicle(true))).toBe(APPROVED);
        });
        it('rejects when the user was rejected by an admin', () => {
            expect(computeStatus(makeUser({ status: PENDING, rejectedAt: new Date() }), makeProfile(), makeVehicle())).toBe(REJECTED);
        });
        it('rejects when the vehicle was rejected by an admin', () => {
            expect(computeStatus(makeUser({ status: APPROVED }), makeProfile(true), makeVehicle(true, new Date()))).toBe(REJECTED);
        });
    });
});
describe('US9 - recordStatusChange audit rows', () => {
    beforeEach(() => {
        VerificationStatusChange.create.mockReset();
        VerificationStatusChange.create.mockResolvedValue({ id: 'row-1' });
    });
    it('records submit transition unverified -> pending without actor', async () => {
        await recordStatusChange('driver-1', UNVERIFIED, PENDING);
        expect(VerificationStatusChange.create).toHaveBeenCalledWith({
            driverId: 'driver-1',
            fromStatus: UNVERIFIED,
            toStatus: PENDING,
            reason: null,
            markedFields: null,
            changedBy: null,
        }, { transaction: undefined });
    });
    it('records resubmit transition rejected -> pending clearing old rejection', async () => {
        await recordStatusChange('driver-1', REJECTED, PENDING);
        expect(VerificationStatusChange.create).toHaveBeenCalledWith({
            driverId: 'driver-1',
            fromStatus: REJECTED,
            toStatus: PENDING,
            reason: null,
            markedFields: null,
            changedBy: null,
        }, { transaction: undefined });
    });
    it('records approve transition with the acting admin', async () => {
        await recordStatusChange('driver-1', PENDING, APPROVED, { changedBy: 'admin-9' });
        expect(VerificationStatusChange.create).toHaveBeenCalledWith({
            driverId: 'driver-1',
            fromStatus: PENDING,
            toStatus: APPROVED,
            reason: null,
            markedFields: null,
            changedBy: 'admin-9',
        }, { transaction: undefined });
    });
    it('records reject transition with reason and marked fields', async () => {
        await recordStatusChange('driver-1', PENDING, REJECTED, {
            reason: 'Documents illegible',
            markedFields: ['license', 'vehicle_photo'],
            changedBy: 'admin-9',
        });
        expect(VerificationStatusChange.create).toHaveBeenCalledWith({
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