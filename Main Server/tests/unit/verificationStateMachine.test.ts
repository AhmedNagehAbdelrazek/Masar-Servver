import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const { VerificationStatusChange } = require('../../Models') as {
  VerificationStatusChange: { create: jest.Mock };
};

jest.mock('../../Models', () => ({
  User: { findByPk: jest.fn(), update: jest.fn() },
  DriverProfile: {},
  Vehicle: {},
  UploadedImage: {},
  VerificationStatusChange: { create: jest.fn() },
}));

jest.mock('../../Services/notificationService', () => ({ sendToUser: jest.fn() }));
jest.mock('../../Services/auditService', () => ({ track: jest.fn() }));

const {
  canEdit,
  guardSubmission,
  computeStatus,
} = require('../../Services/driverVerificationService') as {
  canEdit: (status: string) => boolean;
  guardSubmission: (status: string) => void;
  computeStatus: (
    user: { verificationStatus: string; verificationRejectedAt: Date | null },
    profile: { idVerified: boolean } | null,
    vehicle: { isVerified: boolean; verificationRejectedAt: Date | null } | null
  ) => string;
};
const { recordStatusChange } = require('../../Services/verificationService') as {
  recordStatusChange: (
    driverId: string,
    fromStatus: string,
    toStatus: string,
    opts?: { reason?: string | null; markedFields?: string[] | null; changedBy?: string | null; transaction?: unknown }
  ) => Promise<unknown>;
};

const UNVERIFIED = 'unverified';
const PENDING = 'pending';
const REJECTED = 'rejected';
const APPROVED = 'approved';

function makeUser({
  status = UNVERIFIED,
  rejectedAt = null,
}: {
  status?: string;
  rejectedAt?: Date | null;
} = {}): { verificationStatus: string; verificationRejectedAt: Date | null } {
  return {
    verificationStatus: status,
    verificationRejectedAt: rejectedAt,
  };
}

function makeProfile(idVerified = false): { idVerified: boolean } {
  return idVerified ? { idVerified: true } : { idVerified: false };
}

function makeVehicle(
  isVerified = false,
  rejectedAt: Date | null = null
): { isVerified: boolean; verificationRejectedAt: Date | null } {
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
      } catch (err: unknown) {
        const e = err as { statusCode?: number; code?: string };
        expect(e.statusCode).toBe(409);
        expect(e.code).toBe('CONFLICT');
      }
    });

    it('throws FORBIDDEN when approved', () => {
      try {
        guardSubmission(APPROVED);
        throw new Error('should have thrown');
      } catch (err: unknown) {
        const e = err as { statusCode?: number; code?: string };
        expect(e.statusCode).toBe(403);
        expect(e.code).toBe('FORBIDDEN');
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
      expect(
        computeStatus(makeUser({ status: PENDING, rejectedAt: new Date() }), makeProfile(), makeVehicle())
      ).toBe(REJECTED);
    });

    it('rejects when the vehicle was rejected by an admin', () => {
      expect(
        computeStatus(makeUser({ status: APPROVED }), makeProfile(true), makeVehicle(true, new Date()))
      ).toBe(REJECTED);
    });
  });
});

describe('US9 - recordStatusChange audit rows', () => {
  beforeEach(() => {
    VerificationStatusChange.create.mockReset();
    VerificationStatusChange.create.mockResolvedValue({ id: 'row-1' } as unknown as never);
  });

  it('records submit transition unverified -> pending without actor', async () => {
    await recordStatusChange('driver-1', UNVERIFIED, PENDING);
    expect(VerificationStatusChange.create).toHaveBeenCalledWith(
      {
        driverId: 'driver-1',
        fromStatus: UNVERIFIED,
        toStatus: PENDING,
        reason: null,
        markedFields: null,
        changedBy: null,
      },
      { transaction: undefined }
    );
  });

  it('records resubmit transition rejected -> pending clearing old rejection', async () => {
    await recordStatusChange('driver-1', REJECTED, PENDING);
    expect(VerificationStatusChange.create).toHaveBeenCalledWith(
      {
        driverId: 'driver-1',
        fromStatus: REJECTED,
        toStatus: PENDING,
        reason: null,
        markedFields: null,
        changedBy: null,
      },
      { transaction: undefined }
    );
  });

  it('records approve transition with the acting admin', async () => {
    await recordStatusChange('driver-1', PENDING, APPROVED, { changedBy: 'admin-9' });
    expect(VerificationStatusChange.create).toHaveBeenCalledWith(
      {
        driverId: 'driver-1',
        fromStatus: PENDING,
        toStatus: APPROVED,
        reason: null,
        markedFields: null,
        changedBy: 'admin-9',
      },
      { transaction: undefined }
    );
  });

  it('records reject transition with reason and marked fields', async () => {
    await recordStatusChange('driver-1', PENDING, REJECTED, {
      reason: 'Documents illegible',
      markedFields: ['license', 'vehicle_photo'],
      changedBy: 'admin-9',
    });
    expect(VerificationStatusChange.create).toHaveBeenCalledWith(
      {
        driverId: 'driver-1',
        fromStatus: PENDING,
        toStatus: REJECTED,
        reason: 'Documents illegible',
        markedFields: ['license', 'vehicle_photo'],
        changedBy: 'admin-9',
      },
      { transaction: undefined }
    );
  });
});
