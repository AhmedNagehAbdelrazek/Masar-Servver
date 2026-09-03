import path from 'path';
import { Worker } from 'worker_threads';
import { runExpirySweep } from './expirySweepJob';
import { runExpiryReminder } from './expiryReminderJob';
import { runLowBalanceWarning } from './lowBalanceWarningJob';
import { runSosEscalation } from './sosEscalationJob';
import { runDataRetention } from './dataRetentionJob';
import { runDriverStats } from './driverStatsJob';

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
};

let started: boolean | string = false;
let worker: Worker | null = null;
let restarts = 0;

function spawnWorker(): void {
  worker = new Worker(path.join(__dirname, 'worker.js'));

  worker.on('error', (err: Error) => {
    console.error('[jobs] worker error:', err.message);
  });

  worker.on('message', (msg: { type?: string; jobs?: string[] }) => {
    if (msg && msg.type === 'started') {
      console.log(`[jobs] worker started with jobs: ${(msg.jobs || []).join(', ')}`);
    }
  });

  worker.on('exit', (code: number | null) => {
    if (code === 0) {
      console.log('[jobs] worker stopped');
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

export { startJobs, JOBS, runExpirySweep, runExpiryReminder, runLowBalanceWarning, runSosEscalation, runDataRetention, runDriverStats };
export default { startJobs, JOBS, runExpirySweep, runExpiryReminder, runLowBalanceWarning, runSosEscalation, runDataRetention, runDriverStats };
module.exports = {
  startJobs,
  JOBS,
  runExpirySweep,
  runExpiryReminder,
  runLowBalanceWarning,
  runSosEscalation,
  runDataRetention,
  runDriverStats,
};
