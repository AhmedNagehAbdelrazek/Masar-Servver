export interface StatChange {
  change: number;
  trend: 'up' | 'down';
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Percentage change between the current cumulative value and the value at the
 * start of the comparison window. Returns null when there is no meaningful
 * baseline (zero previous) or when nothing changed, so the dashboard hides the
 * badge instead of showing a fake arrow.
 */
export function percentChange(current: number, previous: number): StatChange | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous <= 0) return null;
  if (current === previous) return null;
  const raw = ((current - previous) / previous) * 100;
  const change = Math.round(raw * 10) / 10;
  return { change, trend: change >= 0 ? 'up' : 'down' };
}

export function daysAgo(days: number, now = new Date()): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

export function dayStart(offsetDays = 0, now = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}
