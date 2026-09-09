"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDriverStats = exports.runDataRetention = exports.runSosEscalation = exports.runLowBalanceWarning = exports.runExpiryReminder = exports.runExpirySweep = exports.JOBS = void 0;
exports.startJobs = startJobs;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const worker_threads_1 = require("worker_threads");
const expirySweepJob_1 = require("./expirySweepJob");
Object.defineProperty(exports, "runExpirySweep", { enumerable: true, get: function () { return expirySweepJob_1.runExpirySweep; } });
const expiryReminderJob_1 = require("./expiryReminderJob");
Object.defineProperty(exports, "runExpiryReminder", { enumerable: true, get: function () { return expiryReminderJob_1.runExpiryReminder; } });
const lowBalanceWarningJob_1 = require("./lowBalanceWarningJob");
Object.defineProperty(exports, "runLowBalanceWarning", { enumerable: true, get: function () { return lowBalanceWarningJob_1.runLowBalanceWarning; } });
const sosEscalationJob_1 = require("./sosEscalationJob");
Object.defineProperty(exports, "runSosEscalation", { enumerable: true, get: function () { return sosEscalationJob_1.runSosEscalation; } });
const dataRetentionJob_1 = require("./dataRetentionJob");
Object.defineProperty(exports, "runDataRetention", { enumerable: true, get: function () { return dataRetentionJob_1.runDataRetention; } });
const driverStatsJob_1 = require("./driverStatsJob");
Object.defineProperty(exports, "runDriverStats", { enumerable: true, get: function () { return driverStatsJob_1.runDriverStats; } });
const JOBS = {
    expirySweep: {
        schedule: process.env.JOB_EXPIRY_SWEEP_CRON || '0 0 * * *',
        task: expirySweepJob_1.runExpirySweep,
    },
    expiryReminder: {
        schedule: process.env.JOB_REMINDER_CRON || '0 9 * * *',
        task: expiryReminderJob_1.runExpiryReminder,
    },
    lowBalanceWarning: {
        schedule: process.env.JOB_LOW_BALANCE_WARNING_CRON || '0 12 * * *',
        task: lowBalanceWarningJob_1.runLowBalanceWarning,
    },
    sosEscalation: {
        schedule: process.env.JOB_SOS_ESCALATION_CRON || '*/1 * * * *',
        task: sosEscalationJob_1.runSosEscalation,
    },
    dataRetention: {
        schedule: process.env.JOB_DATA_RETENTION_CRON || '0 3 * * *',
        task: dataRetentionJob_1.runDataRetention,
    },
    driverStats: {
        schedule: process.env.JOB_DRIVER_STATS_CRON || '0 2 * * *',
        task: driverStatsJob_1.runDriverStats,
    },
};
exports.JOBS = JOBS;
let started = false;
let worker = null;
let restarts = 0;
function resolveWorkerPath() {
    // Compiled runtime (dist/) ships worker.js; tsx source runtime only has
    // worker.ts. Pick whichever exists so `new Worker()` never points at a
    // missing file (which otherwise crash-loops every 30s).
    const jsPath = path_1.default.join(__dirname, 'worker.js');
    try {
        if (fs_1.default.existsSync(jsPath))
            return jsPath;
    }
    catch {
        // ignore and fall through to the TS source below
    }
    return path_1.default.join(__dirname, 'worker.ts');
}
function bootInline(reason) {
    console.warn(`[jobs] ${reason}; running jobs inline in this process instead`);
    require('./worker')
        .boot()
        .then(() => console.log('[jobs] inline worker started'))
        .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[jobs] inline worker boot failed:', msg);
    });
}
function spawnWorker() {
    const workerPath = resolveWorkerPath();
    let instance;
    try {
        instance = new worker_threads_1.Worker(workerPath);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        bootInline(`cannot spawn worker at ${workerPath} (${msg})`);
        return;
    }
    worker = instance;
    // The worker posts { type: 'started' } once it boots. Any error before that
    // means it never got going (missing file, unsupported extension/loader,
    // bad runtime, …) — respawning would hot-loop forever, so fall back to
    // in-process jobs exactly once. Crashes after a successful start keep the
    // old respawn-with-backoff behaviour.
    let startedOk = false;
    let startError = null;
    instance.on('error', (err) => {
        console.error('[jobs] worker error:', err.message);
        if (!startedOk && !startError)
            startError = err;
    });
    instance.on('message', (msg) => {
        if (msg && msg.type === 'started') {
            startedOk = true;
            startError = null;
            console.log(`[jobs] worker started with jobs: ${(msg.jobs || []).join(', ')}`);
        }
    });
    instance.on('exit', (code) => {
        if (code === 0) {
            console.log('[jobs] worker stopped');
            return;
        }
        if (!startedOk && startError) {
            worker = null;
            bootInline(`worker failed to start at ${workerPath} (${startError.message})`);
            return;
        }
        const delay = Math.min(30_000, 1_000 * 2 ** restarts);
        restarts += 1;
        console.warn(`[jobs] worker exited unexpectedly (code ${code}); restarting in ${delay}ms`);
        setTimeout(spawnWorker, delay);
    });
}
function startJobs() {
    if (started || process.env.NODE_ENV === 'test')
        return started;
    started = true;
    if (process.env.JOBS_INLINE === '1') {
        require('./worker')
            .boot()
            .catch((err) => {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[jobs] inline worker boot failed:', msg);
        });
        return started;
    }
    spawnWorker();
    return started;
}
exports.default = { startJobs, JOBS, runExpirySweep: expirySweepJob_1.runExpirySweep, runExpiryReminder: expiryReminderJob_1.runExpiryReminder, runLowBalanceWarning: lowBalanceWarningJob_1.runLowBalanceWarning, runSosEscalation: sosEscalationJob_1.runSosEscalation, runDataRetention: dataRetentionJob_1.runDataRetention, runDriverStats: driverStatsJob_1.runDriverStats };
module.exports = {
    startJobs,
    JOBS,
    runExpirySweep: expirySweepJob_1.runExpirySweep,
    runExpiryReminder: expiryReminderJob_1.runExpiryReminder,
    runLowBalanceWarning: lowBalanceWarningJob_1.runLowBalanceWarning,
    runSosEscalation: sosEscalationJob_1.runSosEscalation,
    runDataRetention: dataRetentionJob_1.runDataRetention,
    runDriverStats: driverStatsJob_1.runDriverStats,
};
//# sourceMappingURL=index.js.map