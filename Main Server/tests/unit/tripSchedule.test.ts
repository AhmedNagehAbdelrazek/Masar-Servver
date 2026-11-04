import { describe, it, expect } from '@jest/globals';
import { hasTripDeparted } from '../../utils/tripSchedule';

const future = (): Date => new Date(Date.now() + 60 * 60 * 1000);
const past = (): Date => new Date(Date.now() - 60 * 1000);

describe('hasTripDeparted', () => {
  it('keeps a future, not-started trip open', () => {
    expect(hasTripDeparted({ departureTime: future(), startedAt: null, completedAt: null })).toBe(false);
  });

  it('closes a trip once its departure time has passed', () => {
    expect(hasTripDeparted({ departureTime: past() })).toBe(true);
  });

  it('closes a trip that was started even if its departure is still in the future', () => {
    expect(hasTripDeparted({ departureTime: future(), startedAt: new Date() })).toBe(true);
  });

  it('closes a trip that was completed even if its departure is still in the future', () => {
    expect(hasTripDeparted({ departureTime: future(), completedAt: new Date() })).toBe(true);
  });

  it('keeps recurring series open: one row represents every occurrence', () => {
    expect(
      hasTripDeparted({
        departureTime: past(),
        isRecurring: true,
        startedAt: new Date(),
        completedAt: new Date(),
      }),
    ).toBe(false);
  });
});
