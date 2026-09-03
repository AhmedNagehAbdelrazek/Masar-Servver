import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';

jest.mock('node-cron', () => ({ schedule: jest.fn(), createTask: jest.fn() }));
jest.mock('../../config/redis', () => ({ getKey: jest.fn(), setKey: jest.fn() }));

const cron = require('node-cron') as {
  schedule: jest.Mock<(...args: unknown[]) => unknown>;
  createTask: jest.Mock<(...args: unknown[]) => unknown>;
};
const redis = require('../../config/redis') as {
  getKey: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  setKey: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
};
const {
  wrapTask,
  findMissedSlots,
  runCatchUp,
  scheduleJobs,
  getLastRun,
  recordLastRun,
} = require('../../jobs/scheduler') as {
  wrapTask: (name: string, fn: (ctx?: unknown) => Promise<unknown>) => (ctx?: unknown) => Promise<unknown | undefined>;
  findMissedSlots: (
    task: { match: (d: Date) => boolean },
    opts: { fromMs: number; toMs: number; toleranceMs: number }
  ) => Date[];
  runCatchUp: (
    task: { match: (d: Date) => boolean; execute: () => Promise<void> },
    name: string
  ) => Promise<number>;
  scheduleJobs: (
    registry: Record<string, { schedule: string; task: (ctx?: unknown) => Promise<unknown> }>,
    opts?: { catchUp?: boolean }
  ) => Record<string, { on: (e: string, cb: (ctx: unknown) => void) => void; emit: (e: string, ctx: unknown) => void; execute: () => Promise<void> }>;
  getLastRun: (name: string) => Promise<Date | null>;
  recordLastRun: (name: string, date: Date) => Promise<void>;
};

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  delete process.env.JOB_MAX_CATCH_UP;
  delete process.env.JOB_MISS_TOLERANCE_MS;
});

function dailyNineAmMatcher(date: Date): boolean {
  return date.getUTCHours() === 9 && date.getUTCMinutes() === 0;
}

describe('findMissedSlots', () => {
  it('returns scheduled slots older than the tolerance', () => {
    const task: { match: (d: Date) => boolean } = { match: dailyNineAmMatcher };
    const toMs: number = new Date('2026-08-09T10:00:00Z').getTime();
    const fromMs: number = new Date('2026-08-07T00:00:00Z').getTime();

    const missed: Date[] = findMissedSlots(task, { fromMs, toMs, toleranceMs: 5 * 60 * 1000 });

    expect(missed).toHaveLength(3);
    expect(missed[0].toISOString()).toBe('2026-08-07T09:00:00.000Z');
    expect(missed[2].toISOString()).toBe('2026-08-09T09:00:00.000Z');
  });

  it('excludes a slot that is still within the tolerance window', () => {
    const task: { match: (d: Date) => boolean } = { match: dailyNineAmMatcher };
    const toMs: number = new Date('2026-08-09T09:02:00Z').getTime();
    const fromMs: number = new Date('2026-08-08T00:00:00Z').getTime();

    const missed: Date[] = findMissedSlots(task, { fromMs, toMs, toleranceMs: 5 * 60 * 1000 });

    expect(missed).toHaveLength(1);
    expect(missed[0].toISOString()).toBe('2026-08-08T09:00:00.000Z');
  });

  it('returns nothing when no slots fall in range', () => {
    const task: { match: (d: Date) => boolean } = { match: dailyNineAmMatcher };
    const fromMs: number = new Date('2026-08-09T09:30:00Z').getTime();
    const toMs: number = new Date('2026-08-09T10:00:00Z').getTime();

    const missed: Date[] = findMissedSlots(task, { fromMs, toMs, toleranceMs: 60 * 1000 });

    expect(missed).toEqual([]);
  });
});

describe('wrapTask', () => {
  it('records the last run after a successful execution', async () => {
    const task: jest.Mock<(...args: unknown[]) => Promise<unknown>> = jest.fn(
      async () => 'done'
    ) as unknown as jest.Mock<(...args: unknown[]) => Promise<unknown>>;
    const wrapped = wrapTask('expirySweep', task as unknown as (ctx?: unknown) => Promise<unknown>);

    const result: unknown = await wrapped({ date: new Date() });

    expect(result).toBe('done');
    expect(redis.setKey).toHaveBeenCalledWith(
      'jobs:lastrun:expirySweep',
      expect.any(String),
      3 * 24 * 60 * 60
    );
  });

  it('skips re-entrant calls while a run is in progress', async () => {
    let resolveRun!: (v: string) => void;
    const gate: Promise<string> = new Promise((resolve) => {
      resolveRun = resolve;
    });
    const task: jest.Mock<(...args: unknown[]) => Promise<unknown>> = jest.fn(
      async () => gate
    ) as unknown as jest.Mock<(...args: unknown[]) => Promise<unknown>>;
    const wrapped = wrapTask('expirySweep', task as unknown as (ctx?: unknown) => Promise<unknown>);

    const first: Promise<unknown | undefined> = wrapped({ date: new Date() });
    const second: unknown | undefined = await wrapped({ date: new Date() });

    expect(second).toBeUndefined();
    expect(redis.setKey).not.toHaveBeenCalled();

    resolveRun('ok');
    await first;
    expect(redis.setKey).toHaveBeenCalledTimes(1);
  });
});

describe('runCatchUp', () => {
  it('runs the most recent missed slots since the last run', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-09T10:00:00Z'));
    redis.getKey.mockResolvedValue('2026-08-08T09:00:00.000Z');

    const execute: jest.Mock<(...args: unknown[]) => Promise<unknown>> = jest.fn(
      async () => undefined
    ) as unknown as jest.Mock<(...args: unknown[]) => Promise<unknown>>;
    const task: { match: (d: Date) => boolean; execute: () => Promise<void> } = {
      match: dailyNineAmMatcher,
      execute: execute as unknown as () => Promise<void>,
    };

    const ran: number = await runCatchUp(task, 'expiryReminder');

    expect(ran).toBe(1);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('caps the number of catch-up runs after a long outage', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-09T10:00:00Z'));
    redis.getKey.mockResolvedValue(null); // no last run -> 7 day backscan
    process.env.JOB_MAX_CATCH_UP = '2';

    const execute: jest.Mock<(...args: unknown[]) => Promise<unknown>> = jest.fn(
      async () => undefined
    ) as unknown as jest.Mock<(...args: unknown[]) => Promise<unknown>>;
    const task: { match: (d: Date) => boolean; execute: () => Promise<void> } = {
      match: dailyNineAmMatcher,
      execute: execute as unknown as () => Promise<void>,
    };

    const ran: number = await runCatchUp(task, 'expirySweep');

    expect(ran).toBe(2);
    expect(execute).toHaveBeenCalledTimes(2);
  });
});

describe('getLastRun / recordLastRun', () => {
  it('round-trips through the redis helpers', async () => {
    redis.getKey.mockResolvedValue('2026-08-09T09:00:00.000Z');

    const lastRun: Date | null = await getLastRun('expirySweep');

    expect(lastRun?.toISOString()).toBe('2026-08-09T09:00:00.000Z');
    expect(redis.getKey).toHaveBeenCalledWith('jobs:lastrun:expirySweep');
  });

  it('returns null when no run was ever recorded', async () => {
    redis.getKey.mockResolvedValue(null);
    expect(await getLastRun('expiryReminder')).toBeNull();
  });

  it('records an ISO timestamp with a TTL', async () => {
    await recordLastRun('lowBalanceWarning', new Date('2026-08-09T09:00:00.000Z'));
    expect(redis.setKey).toHaveBeenCalledWith(
      'jobs:lastrun:lowBalanceWarning',
      '2026-08-09T09:00:00.000Z',
      3 * 24 * 60 * 60
    );
  });
});

describe('scheduleJobs', () => {
  function fakeTask(): {
    execute: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
    on: (event: string, fn: (ctx: unknown) => void) => void;
    emit: (event: string, ctx: unknown) => void;
  } {
    const emitter: EventEmitter = new EventEmitter();
    return {
      execute: jest.fn(async () => undefined) as unknown as jest.Mock<(...args: unknown[]) => Promise<unknown>>,
      on: (event: string, fn: (ctx: unknown) => void): void => {
        emitter.on(event, fn);
      },
      emit: (event: string, ctx: unknown): void => {
        emitter.emit(event, ctx);
      },
    };
  }

  const registry: Record<string, { schedule: string; task: jest.Mock<(...args: unknown[]) => Promise<unknown>> }> = {
    reminder: {
      schedule: '0 9 * * *',
      task: jest.fn(async () => undefined) as unknown as jest.Mock<(...args: unknown[]) => Promise<unknown>>,
    },
    disabled: {
      schedule: 'off',
      task: jest.fn() as unknown as jest.Mock<(...args: unknown[]) => Promise<unknown>>,
    },
  };

  it('schedules enabled jobs with overlap prevention and a timezone', () => {
    cron.schedule.mockReturnValue(fakeTask() as unknown as never);

    const tasks: Record<string, unknown> = scheduleJobs(
      registry as unknown as Record<string, { schedule: string; task: (ctx?: unknown) => Promise<unknown> }>,
      { catchUp: false }
    );

    expect(cron.schedule).toHaveBeenCalledTimes(1);
    expect(cron.schedule).toHaveBeenCalledWith(
      '0 9 * * *',
      expect.any(Function),
      expect.objectContaining({ name: 'reminder', noOverlap: true, timezone: expect.any(String) })
    );
    expect(Object.keys(tasks)).toEqual(['reminder']);
  });

  it('retries a missed execution through the execution:missed hook', async () => {
    const task = fakeTask();
    cron.schedule.mockReturnValue(task as unknown as never);

    const tasks: Record<string, { emit: (e: string, ctx: unknown) => void }> = scheduleJobs(
      registry as unknown as Record<string, { schedule: string; task: (ctx?: unknown) => Promise<unknown> }>,
      { catchUp: false }
    ) as unknown as Record<string, { emit: (e: string, ctx: unknown) => void }>;
    tasks.reminder.emit('execution:missed', { date: new Date('2026-08-09T09:00:00Z') });

    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(task.execute).toHaveBeenCalledTimes(1);
  });
});
