import { describe, expect, it } from 'vitest';
import {
  canEditVerification,
  computeVerificationStatus,
  guardVerificationSubmission,
} from './verification-state.js';

// 1:1 port of Main Server/tests/unit/verificationStateMachine.test.ts
// (state-machine part; recordStatusChange is covered by e2e transition asserts).
const UNVERIFIED = 'unverified';
const PENDING = 'pending';
const REJECTED = 'rejected';
const APPROVED = 'approved';

function makeUser(status = UNVERIFIED, rejectedAt: Date | null = null): {
  verificationStatus: string;
  verificationRejectedAt: Date | null;
} {
  return { verificationStatus: status, verificationRejectedAt: rejectedAt };
}

describe('verification state machine', () => {
  it('allows editing when unverified or rejected', () => {
    expect(canEditVerification(UNVERIFIED)).toBe(true);
    expect(canEditVerification(REJECTED)).toBe(true);
  });

  it('blocks editing when pending or approved', () => {
    expect(canEditVerification(PENDING)).toBe(false);
    expect(canEditVerification(APPROVED)).toBe(false);
  });

  it('allows initial submission and resubmission', () => {
    expect(() => guardVerificationSubmission(UNVERIFIED)).not.toThrow();
    expect(() => guardVerificationSubmission(REJECTED)).not.toThrow();
  });

  it('throws CONFLICT while pending', () => {
    try {
      guardVerificationSubmission(PENDING);
      throw new Error('should have thrown');
    } catch (err) {
      const e = err as { getStatus?: () => number; getResponse?: () => unknown };
      expect(e.getStatus?.()).toBe(409);
      expect((e.getResponse?.() as { code?: string })?.code).toBe('CONFLICT');
    }
  });

  it('throws FORBIDDEN when approved', () => {
    try {
      guardVerificationSubmission(APPROVED);
      throw new Error('should have thrown');
    } catch (err) {
      const e = err as { getStatus?: () => number; getResponse?: () => unknown };
      expect(e.getStatus?.()).toBe(403);
      expect((e.getResponse?.() as { code?: string })?.code).toBe('FORBIDDEN');
    }
  });

  it('starts unverified with no submission', () => {
    expect(computeVerificationStatus(makeUser(), null, null)).toBe(UNVERIFIED);
  });

  it('moves to pending once a profile/vehicle exists', () => {
    expect(computeVerificationStatus(makeUser(), { idVerified: false }, null)).toBe(PENDING);
    expect(
      computeVerificationStatus(makeUser(), null, { isVerified: false, verificationRejectedAt: null }),
    ).toBe(PENDING);
  });

  it('approves only when profile and vehicle are both verified', () => {
    expect(
      computeVerificationStatus(makeUser(), { idVerified: true }, { isVerified: true, verificationRejectedAt: null }),
    ).toBe(APPROVED);
    expect(
      computeVerificationStatus(makeUser(), { idVerified: false }, { isVerified: true, verificationRejectedAt: null }),
    ).toBe(PENDING);
  });

  it('rejects when the user or vehicle was rejected by an admin', () => {
    expect(
      computeVerificationStatus(makeUser(PENDING, new Date()), { idVerified: false }, null),
    ).toBe(REJECTED);
    expect(
      computeVerificationStatus(
        makeUser(APPROVED),
        { idVerified: true },
        { isVerified: true, verificationRejectedAt: new Date() },
      ),
    ).toBe(REJECTED);
  });
});
