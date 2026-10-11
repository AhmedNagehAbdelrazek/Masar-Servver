import { describe, expect, it } from 'vitest';
import { CommissionService } from './commission.service.js';

// Unit coverage for the pure commission math (HTTP deduction flows are
// trip-gated; their tests land with Wave 5).
describe('minimumBalanceForPlan', () => {
  const service = new CommissionService(
    null as never,
    null as never,
  );

  it('computes fare × rate (15 × 10% = 1.50)', () => {
    expect(service.minimumBalanceForPlan({ planPercentageCut: 10 }, 15)).toBe(1.5);
  });

  it('returns 0 without a plan', () => {
    expect(service.minimumBalanceForPlan(null, 15)).toBe(0);
  });
});
