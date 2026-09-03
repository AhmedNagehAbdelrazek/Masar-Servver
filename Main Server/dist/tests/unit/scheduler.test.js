"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const events_1 = require("events");
globals_1.jest.mock('node-cron', () => ({ schedule: globals_1.jest.fn(), createTask: globals_1.jest.fn() }));
globals_1.jest.mock('../../config/redis', () => ({ getKey: globals_1.jest.fn(), setKey: globals_1.jest.fn() }));
const cron = require('node-cron');
const redis = require('../../config/redis');
const { wrapTask, findMissedSlots, runCatchUp, scheduleJobs, getLastRun, recordLastRun, } = require('../../jobs/scheduler');
(0, globals_1.afterEach)(() => {
    globals_1.jest.clearAllMocks();
    globals_1.jest.useRealTimers();
    delete process.env.JOB_MAX_CATCH_UP;
    delete process.env.JOB_MISS_TOLERANCE_MS;
});
function dailyNineAmMatcher(date) {
    return date.getUTCHours() === 9 && date.getUTCMinutes() === 0;
}
(0, globals_1.describe)('findMissedSlots', () => {
    (0, globals_1.it)('returns scheduled slots older than the tolerance', () => {
        const task = { match: dailyNineAmMatcher };
        const toMs = new Date('2026-08-09T10:00:00Z').getTime();
        const fromMs = new Date('2026-08-07T00:00:00Z').getTime();
        const missed = findMissedSlots(task, { fromMs, toMs, toleranceMs: 5 * 60 * 1000 });
        (0, globals_1.expect)(missed).toHaveLength(3);
        (0, globals_1.expect)(missed[0].toISOString()).toBe('2026-08-07T09:00:00.000Z');
        (0, globals_1.expect)(missed[2].toISOString()).toBe('2026-08-09T09:00:00.000Z');
    });
    (0, globals_1.it)('excludes a slot that is still within the tolerance window', () => {
        const task = { match: dailyNineAmMatcher };
        const toMs = new Date('2026-08-09T09:02:00Z').getTime();
        const fromMs = new Date('2026-08-08T00:00:00Z').getTime();
        const missed = findMissedSlots(task, { fromMs, toMs, toleranceMs: 5 * 60 * 1000 });
        (0, globals_1.expect)(missed).toHaveLength(1);
        (0, globals_1.expect)(missed[0].toISOString()).toBe('2026-08-08T09:00:00.000Z');
    });
    (0, globals_1.it)('returns nothing when no slots fall in range', () => {
        const task = { match: dailyNineAmMatcher };
        const fromMs = new Date('2026-08-09T09:30:00Z').getTime();
        const toMs = new Date('2026-08-09T10:00:00Z').getTime();
        const missed = findMissedSlots(task, { fromMs, toMs, toleranceMs: 60 * 1000 });
        (0, globals_1.expect)(missed).toEqual([]);
    });
});
(0, globals_1.describe)('wrapTask', () => {
    (0, globals_1.it)('records the last run after a successful execution', async () => {
        const task = globals_1.jest.fn(async () => 'done');
        const wrapped = wrapTask('expirySweep', task);
        const result = await wrapped({ date: new Date() });
        (0, globals_1.expect)(result).toBe('done');
        (0, globals_1.expect)(redis.setKey).toHaveBeenCalledWith('jobs:lastrun:expirySweep', globals_1.expect.any(String), 3 * 24 * 60 * 60);
    });
    (0, globals_1.it)('skips re-entrant calls while a run is in progress', async () => {
        let resolveRun;
        const gate = new Promise((resolve) => {
            resolveRun = resolve;
        });
        const task = globals_1.jest.fn(async () => gate);
        const wrapped = wrapTask('expirySweep', task);
        const first = wrapped({ date: new Date() });
        const second = await wrapped({ date: new Date() });
        (0, globals_1.expect)(second).toBeUndefined();
        (0, globals_1.expect)(redis.setKey).not.toHaveBeenCalled();
        resolveRun('ok');
        await first;
        (0, globals_1.expect)(redis.setKey).toHaveBeenCalledTimes(1);
    });
});
(0, globals_1.describe)('runCatchUp', () => {
    (0, globals_1.it)('runs the most recent missed slots since the last run', async () => {
        globals_1.jest.useFakeTimers();
        globals_1.jest.setSystemTime(new Date('2026-08-09T10:00:00Z'));
        redis.getKey.mockResolvedValue('2026-08-08T09:00:00.000Z');
        const execute = globals_1.jest.fn(async () => undefined);
        const task = {
            match: dailyNineAmMatcher,
            execute: execute,
        };
        const ran = await runCatchUp(task, 'expiryReminder');
        (0, globals_1.expect)(ran).toBe(1);
        (0, globals_1.expect)(execute).toHaveBeenCalledTimes(1);
    });
    (0, globals_1.it)('caps the number of catch-up runs after a long outage', async () => {
        globals_1.jest.useFakeTimers();
        globals_1.jest.setSystemTime(new Date('2026-08-09T10:00:00Z'));
        redis.getKey.mockResolvedValue(null); // no last run -> 7 day backscan
        process.env.JOB_MAX_CATCH_UP = '2';
        const execute = globals_1.jest.fn(async () => undefined);
        const task = {
            match: dailyNineAmMatcher,
            execute: execute,
        };
        const ran = await runCatchUp(task, 'expirySweep');
        (0, globals_1.expect)(ran).toBe(2);
        (0, globals_1.expect)(execute).toHaveBeenCalledTimes(2);
    });
});
(0, globals_1.describe)('getLastRun / recordLastRun', () => {
    (0, globals_1.it)('round-trips through the redis helpers', async () => {
        redis.getKey.mockResolvedValue('2026-08-09T09:00:00.000Z');
        const lastRun = await getLastRun('expirySweep');
        (0, globals_1.expect)(lastRun?.toISOString()).toBe('2026-08-09T09:00:00.000Z');
        (0, globals_1.expect)(redis.getKey).toHaveBeenCalledWith('jobs:lastrun:expirySweep');
    });
    (0, globals_1.it)('returns null when no run was ever recorded', async () => {
        redis.getKey.mockResolvedValue(null);
        (0, globals_1.expect)(await getLastRun('expiryReminder')).toBeNull();
    });
    (0, globals_1.it)('records an ISO timestamp with a TTL', async () => {
        await recordLastRun('lowBalanceWarning', new Date('2026-08-09T09:00:00.000Z'));
        (0, globals_1.expect)(redis.setKey).toHaveBeenCalledWith('jobs:lastrun:lowBalanceWarning', '2026-08-09T09:00:00.000Z', 3 * 24 * 60 * 60);
    });
});
(0, globals_1.describe)('scheduleJobs', () => {
    function fakeTask() {
        const emitter = new events_1.EventEmitter();
        return {
            execute: globals_1.jest.fn(async () => undefined),
            on: (event, fn) => {
                emitter.on(event, fn);
            },
            emit: (event, ctx) => {
                emitter.emit(event, ctx);
            },
        };
    }
    const registry = {
        reminder: {
            schedule: '0 9 * * *',
            task: globals_1.jest.fn(async () => undefined),
        },
        disabled: {
            schedule: 'off',
            task: globals_1.jest.fn(),
        },
    };
    (0, globals_1.it)('schedules enabled jobs with overlap prevention and a timezone', () => {
        cron.schedule.mockReturnValue(fakeTask());
        const tasks = scheduleJobs(registry, { catchUp: false });
        (0, globals_1.expect)(cron.schedule).toHaveBeenCalledTimes(1);
        (0, globals_1.expect)(cron.schedule).toHaveBeenCalledWith('0 9 * * *', globals_1.expect.any(Function), globals_1.expect.objectContaining({ name: 'reminder', noOverlap: true, timezone: globals_1.expect.any(String) }));
        (0, globals_1.expect)(Object.keys(tasks)).toEqual(['reminder']);
    });
    (0, globals_1.it)('retries a missed execution through the execution:missed hook', async () => {
        const task = fakeTask();
        cron.schedule.mockReturnValue(task);
        const tasks = scheduleJobs(registry, { catchUp: false });
        tasks.reminder.emit('execution:missed', { date: new Date('2026-08-09T09:00:00Z') });
        await new Promise((resolve) => setImmediate(resolve));
        (0, globals_1.expect)(task.execute).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=scheduler.test.js.map