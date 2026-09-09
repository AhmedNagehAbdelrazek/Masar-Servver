import fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';
import { runExpirySweep } from './expirySweepJob';
import { runExpiryReminder } from './expiryReminderJob';
import { runLowBalanceWarning } from './lowBalanceWarningJob';
import { runSosEscalation } from './sosEscalationJob';
import { runDataRetention } from './dataRetentionJob';
import { runDriverStats } from './driverStatsJob';
import { runTripLifecycle } from './tripLifecycleJob';

interface JobDef {
  schedule: string;
  task: () => Promise<unknown>;
}

const JOBS: Record<string, JobDef> = {
  expirySweep: {
    schedule: process.env.JOB_EXPIRY_SWEEP_CRON || '0 0 * * *',
    task: runExpirySweep,
  },
  expiryReminder: {
    schedule: process.env.JOB_REMINDER_CRON || '0 9 * * *',
    task: runExpiryReminder,
  },
  lowBalanceWarning: {
    schedule: process.env.JOB_LOW_BALANCE_WARNING_CRON || '0 12 * * *',
    task: runLowBalanceWarning,
  },
  sosEscalation: {
    schedule: process.env.JOB_SOS_ESCALATION_CRON || '*/1 * * * *',
    task: runSosEscalation,
  },
  dataRetention: {
    schedule: process.env.JOB_DATA_RETENTION_CRON || '0 3 * * *',
    task: runDataRetention,
  },
  driverStats: {
    schedule: process.env.JOB_DRIVER_STATS_CRON || '0 2 * * *',
    task: runDriverStats,
  },
  tripLifecycle: {
    schedule: process.env.JOB_TRIP_LIFECYCLE_CRON || '*/15 * * * *',
    task: runTripLifecycle,
  },
};

let started: boolean | string = false;
let worker: Worker | null = null;
let restarts = 0;

function resolveWorkerPath(): string {
  // Compiled runtime (dist/) ships worker.js; tsx source runtime only has
  // worker.ts. Pick whichever exists so `new Worker()` never points at a
  // missing file (which otherwise crash-loops every 30s).
  const jsPath: string = path.join(__dirname, 'worker.js');
  try {
    if (fs.existsSync(jsPath)) return jsPath;
  } catch {
    // ignore and fall through to the TS source below
  }
  return path.join(__dirname, 'worker.ts');
}

function bootInline(reason: string): void {
  console.warn(`[jobs] ${reason}; running jobs inline in this process instead`);
  (require('./worker') as { boot: () => Promise<void> })
    .boot()
    .then(() => console.log('[jobs] inline worker started'))
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[jobs] inline worker boot failed:', msg);
    });
}

function spawnWorker(): void {
  const workerPath: string = resolveWorkerPath();
  let instance: Worker;
  try {
    instance = new Worker(workerPath);
  } catch (err: unknown) {
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
  let startError: Error | null = null;

  instance.on('error', (err: Error) => {
    console.error('[jobs] worker error:', err.message);
    if (!startedOk && !startError) startError = err;
  });

  instance.on('message', (msg: { type?: string; jobs?: string[] }) => {
    if (msg && msg.type === 'started') {
      startedOk = true;
      startError = null;
      console.log(`[jobs] worker started with jobs: ${(msg.jobs || []).join(', ')}`);
    }
  });

  instance.on('exit', (code: number | null) => {
    if (code === 0) {
      console.log('[jobs] worker stopped');
      return;
    }
    if (!startedOk && startError) {
      worker = null;
      bootInline(`worker failed to start at ${workerPath} (${startError.message})`);
      return;
    }
    const delay: number = Math.min(30_000, 1_000 * 2 ** restarts);
    restarts += 1;
    console.warn(`[jobs] worker exited unexpectedly (code ${code}); restarting in ${delay}ms`);
    setTimeout(spawnWorker, delay);
  });
}

function startJobs(): boolean | string {
  if (started || process.env.NODE_ENV === 'test') return started;
  started = true;

  if (process.env.JOBS_INLINE === '1') {
    (require('./worker') as { boot: () => Promise<void> })
      .boot()
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[jobs] inline worker boot failed:', msg);
      });
    return started;
  }

  spawnWorker();
  return started;
}

export { startJobs, JOBS, runExpirySweep, runExpiryReminder, runLowBalanceWarning, runSosEscalation, runDataRetention, runDriverStats, runTripLifecycle };
export default { startJobs, JOBS, runExpirySweep, runExpiryReminder, runLowBalanceWarning, runSosEscalation, runDataRetention, runDriverStats, runTripLifecycle };
module.exports = {
  startJobs,
  JOBS,
  runExpirySweep,
  runExpiryReminder,
  runLowBalanceWarning,
  runSosEscalation,
  runDataRetention,
  runDriverStats,
  runTripLifecycle,
};
