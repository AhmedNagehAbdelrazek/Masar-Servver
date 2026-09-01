const path = require('path');
const { Worker } = require('worker_threads');
const { runExpirySweep } = require('./expirySweepJob');
const { runExpiryReminder } = require('./expiryReminderJob');
const { runLowBalanceWarning } = require('./lowBalanceWarningJob');
const { runSosEscalation } = require('./sosEscalationJob');
const { runDataRetention } = require('./dataRetentionJob');
const { runDriverStats } = require('./driverStatsJob');

/**
 * Scheduled jobs registry (T050). Cron schedules come from env vars with
 * sensible daily defaults. Set a schedule to "off" to disable a job.
 *
 * The jobs themselves are executed inside a dedicated worker thread
 * (worker.js) so that node-cron's timers are not blocked by the API process's
 * event loop. Set `JOBS_INLINE=1` to run them on the main thread instead.
 */
const JOBS = {
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

let started = false;
let worker = null;
let restarts = 0;

/**
 * Spawn the job scheduler on a separate thread, restarting it with backoff
 * if it dies unexpectedly. The thread keeps the process alive by design.
 */
function spawnWorker() {
  worker = new Worker(path.join(__dirname, 'worker.js'));

  worker.on('error', (err) => {
    console.error('[jobs] worker error:', err.message);
  });

  worker.on('message', (msg) => {
    if (msg && msg.type === 'started') {
      console.log(`[jobs] worker started with jobs: ${(msg.jobs || []).join(', ')}`);
    }
  });

  worker.on('exit', (code) => {
    if (code === 0) {
      console.log('[jobs] worker stopped');
      return;
    }
    const delay = Math.min(30_000, 1_000 * 2 ** restarts);
    restarts += 1;
    console.warn(`[jobs] worker exited unexpectedly (code ${code}); restarting in ${delay}ms`);
    setTimeout(spawnWorker, delay);
  });
}

/**
 * Start the job scheduler. Skipped entirely in the test environment — jobs
 * are exercised directly by the unit tests there.
 */
function startJobs() {
  if (started || process.env.NODE_ENV === 'test') return started;
  started = true;

  if (process.env.JOBS_INLINE === '1') {
    require('./worker')
      .boot()
      .catch((err) => console.error('[jobs] inline worker boot failed:', err));
    return started;
  }

  spawnWorker();
  return started;
}

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
