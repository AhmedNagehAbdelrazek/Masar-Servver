"use strict";
const cron = require('node-cron');
const { getKey, setKey } = require('../config/redis');
/**
 * Cron scheduling + missed-execution recovery (T050).
 *
 * node-cron skips executions it could not fire on time (blocked event loop,
 * machine sleep) and only logs a warning. This module wraps every job with:
 *
 *  1. Redis-backed last-run tracking, so a missed slot can be detected even
 *     across process restarts (e.g. the server was down at 09:00).
 *  2. An `execution:missed` hook that re-runs the job immediately via
 *     `task.execute()` — "retry once it has a chance".
 *  3. Optional startup catch-up that runs the most recent missed slots when
 *     the scheduler boots (defaults on; `JOB_CATCH_UP=false` to disable).
 *
 * Runs inside a worker thread (see worker.js) so API traffic on the main
 * thread cannot starve the cron timers.
 */
const LAST_RUN_KEY_PREFIX = 'jobs:lastrun:';
const LAST_RUN_TTL_SECONDS = 3 * 24 * 60 * 60; // 3 days
const DEFAULT_BACKSCAN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEFAULT_MISS_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_CATCH_UP = 3;
const STEP_MS = 60 * 1000;
function lastRunKey(name) {
    return `${LAST_RUN_KEY_PREFIX}${name}`;
}
function configInt(envName, fallback) {
    const n = parseInt(process.env[envName], 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
}
function missToleranceMs() {
    return configInt('JOB_MISS_TOLERANCE_MS', DEFAULT_MISS_TOLERANCE_MS);
}
function maxCatchUpRuns() {
    return configInt('JOB_MAX_CATCH_UP', DEFAULT_MAX_CATCH_UP);
}
async function getLastRun(name) {
    const iso = await getKey(lastRunKey(name));
    return iso ? new Date(iso) : null;
}
async function recordLastRun(name, date = new Date()) {
    await setKey(lastRunKey(name), date.toISOString(), LAST_RUN_TTL_SECONDS);
}
/**
 * Wraps a job so that (a) a single run is never re-entered and (b) the
 * successful finish is persisted as the job's last run.
 */
function wrapTask(name, taskFn) {
    let running = false;
    return async function run(context) {
        if (running) {
            console.warn(`[jobs] ${name}: previous run still in progress, skipping this tick`);
            return undefined;
        }
        running = true;
        try {
            const result = await taskFn(context);
            await recordLastRun(name);
            return result;
        }
        finally {
            running = false;
        }
    };
}
/**
 * Yields timestamps (ms) matching the task's pattern, walking backwards from
 * `toMs` in whole-minute steps. `task.match()` requires a zero-second date,
 * hence the snap to the minute.
 */
function* scanMissedSlots(task, fromMs, toMs) {
    const snapped = new Date(toMs);
    snapped.setSeconds(0, 0);
    for (let t = snapped.getTime() - STEP_MS; t >= fromMs; t -= STEP_MS) {
        if (task.match(new Date(t)))
            yield t;
    }
}
/**
 * Returns ascending list of scheduled slots in [fromMs, toMs] that are older
 * than `toleranceMs` relative to `toMs` (i.e. executions that were skipped).
 */
function findMissedSlots(task, { fromMs, toMs, toleranceMs }) {
    const missed = [];
    for (const t of scanMissedSlots(task, fromMs, toMs)) {
        if (toMs - t >= toleranceMs)
            missed.push(new Date(t));
    }
    missed.reverse(); // oldest first
    return missed;
}
/**
 * Runs the most recent missed slots once each. Without a stored last run we
 * look back `DEFAULT_BACKSCAN_MS` so a brand-new deployment doesn't replay
 * ancient history. Catch-up count is capped to avoid a flood after a long
 * outage. Returns the number of catch-up runs executed.
 */
async function runCatchUp(task, name) {
    const lastRun = await getLastRun(name);
    const now = Date.now();
    // Slots strictly after the stored last run: skip the minute it finished in.
    const fromMs = lastRun ? lastRun.getTime() + STEP_MS : now - DEFAULT_BACKSCAN_MS;
    const slots = findMissedSlots(task, { fromMs, toMs: now, toleranceMs: missToleranceMs() });
    const toRun = slots.slice(-maxCatchUpRuns());
    for (const slot of toRun) {
        console.warn(`[jobs] ${name}: missed run at ${slot.toISOString()}, executing now`);
        try {
            await task.execute();
        }
        catch (err) {
            console.error(`[jobs] ${name} catch-up failed:`, err.message);
        }
    }
    return toRun.length;
}
/**
 * Registers every job in `jobRegistry` with node-cron. `catchUp` enables the
 * startup catch-up pass. Returns a map of job name -> ScheduledTask.
 */
function scheduleJobs(jobRegistry, { catchUp = false } = {}) {
    const timezone = process.env.JOB_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    const tasks = {};
    for (const [name, { schedule, task }] of Object.entries(jobRegistry)) {
        if (!schedule || schedule === 'off')
            continue;
        const cronTask = cron.schedule(schedule, wrapTask(name, task), {
            name,
            timezone,
            noOverlap: true,
        });
        cronTask.on('execution:missed', (context) => {
            const slot = context && context.date;
            console.warn(`[jobs] ${name}: missed run at ${slot ? slot.toISOString() : 'unknown'}, executing now`);
            cronTask.execute().catch((err) => console.error(`[jobs] ${name} missed-run retry failed:`, err.message));
        });
        if (catchUp) {
            runCatchUp(cronTask, name).catch((err) => console.error(`[jobs] ${name} startup catch-up failed:`, err.message));
        }
        console.log(`[jobs] scheduled ${name} at "${schedule}"${timezone ? ` (${timezone})` : ''}`);
        tasks[name] = cronTask;
    }
    return tasks;
}
module.exports = {
    scheduleJobs,
    wrapTask,
    findMissedSlots,
    runCatchUp,
    getLastRun,
    recordLastRun,
};
//# sourceMappingURL=scheduler.js.map