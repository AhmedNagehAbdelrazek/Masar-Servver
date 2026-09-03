"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleJobs = scheduleJobs;
exports.wrapTask = wrapTask;
exports.findMissedSlots = findMissedSlots;
exports.runCatchUp = runCatchUp;
exports.getLastRun = getLastRun;
exports.recordLastRun = recordLastRun;
const node_cron_1 = __importDefault(require("node-cron"));
const redis_1 = require("../config/redis");
const LAST_RUN_KEY_PREFIX = 'jobs:lastrun:';
const LAST_RUN_TTL_SECONDS = 3 * 24 * 60 * 60;
const DEFAULT_BACKSCAN_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_MISS_TOLERANCE_MS = 5 * 60 * 1000;
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
    const iso = await (0, redis_1.getKey)(lastRunKey(name));
    return iso ? new Date(iso) : null;
}
async function recordLastRun(name, date = new Date()) {
    await (0, redis_1.setKey)(lastRunKey(name), date.toISOString(), LAST_RUN_TTL_SECONDS);
}
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
function* scanMissedSlots(task, fromMs, toMs) {
    const snapped = new Date(toMs);
    snapped.setSeconds(0, 0);
    for (let t = snapped.getTime() - STEP_MS; t >= fromMs; t -= STEP_MS) {
        if (task.match(new Date(t)))
            yield t;
    }
}
function findMissedSlots(task, opts) {
    const missed = [];
    for (const t of scanMissedSlots(task, opts.fromMs, opts.toMs)) {
        if (opts.toMs - t >= opts.toleranceMs)
            missed.push(new Date(t));
    }
    missed.reverse();
    return missed;
}
async function runCatchUp(task, name) {
    const lastRun = await getLastRun(name);
    const now = Date.now();
    const fromMs = lastRun ? lastRun.getTime() + STEP_MS : now - DEFAULT_BACKSCAN_MS;
    const slots = findMissedSlots(task, { fromMs, toMs: now, toleranceMs: missToleranceMs() });
    const toRun = slots.slice(-maxCatchUpRuns());
    for (const slot of toRun) {
        console.warn(`[jobs] ${name}: missed run at ${slot.toISOString()}, executing now`);
        try {
            await task.execute();
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`[jobs] ${name} catch-up failed:`, msg);
        }
    }
    return toRun.length;
}
function scheduleJobs(jobRegistry, opts = {}) {
    const timezone = process.env.JOB_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    const tasks = {};
    for (const [name, { schedule, task }] of Object.entries(jobRegistry)) {
        if (!schedule || schedule === 'off')
            continue;
        const cronTask = node_cron_1.default.schedule(schedule, wrapTask(name, task), {
            name,
            timezone,
            noOverlap: true,
        });
        cronTask.on('execution:missed', (context) => {
            const slot = context && context.date;
            console.warn(`[jobs] ${name}: missed run at ${slot ? slot.toISOString() : 'unknown'}, executing now`);
            cronTask.execute().catch((err) => {
                const msg = err instanceof Error ? err.message : String(err);
                console.error(`[jobs] ${name} missed-run retry failed:`, msg);
            });
        });
        if (opts.catchUp) {
            runCatchUp(cronTask, name).catch((err) => {
                const msg = err instanceof Error ? err.message : String(err);
                console.error(`[jobs] ${name} startup catch-up failed:`, msg);
            });
        }
        console.log(`[jobs] scheduled ${name} at "${schedule}"${timezone ? ` (${timezone})` : ''}`);
        tasks[name] = cronTask;
    }
    return tasks;
}
exports.default = { scheduleJobs, wrapTask, findMissedSlots, runCatchUp, getLastRun, recordLastRun };
module.exports = {
    scheduleJobs,
    wrapTask,
    findMissedSlots,
    runCatchUp,
    getLastRun,
    recordLastRun,
};
//# sourceMappingURL=scheduler.js.map