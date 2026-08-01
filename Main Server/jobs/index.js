const cron = require('node-cron');
const { runExpirySweep } = require('./expirySweepJob');
const { runExpiryReminder } = require('./expiryReminderJob');
const { runLowBalanceWarning } = require('./lowBalanceWarningJob');

/**
 * Scheduled jobs registry (T050). Cron schedules come from env vars with
 * sensible daily defaults. Set a schedule to "off" to disable a job.
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
};

let started = false;

/**
 * Register all jobs with node-cron. Skipped entirely in the test
 * environment — jobs are exercised directly by the unit tests there.
 */
function startJobs() {
  if (started || process.env.NODE_ENV === 'test') return started;
  started = true;

  for (const [name, { schedule, task }] of Object.entries(JOBS)) {
    if (!schedule || schedule === 'off') continue;
    cron.schedule(schedule, () => {
      task().catch((err) => console.error(`[jobs] ${name} failed:`, err.message));
    });
    console.log(`[jobs] scheduled ${name} at "${schedule}"`);
  }

  return started;
}

module.exports = {
  startJobs,
  JOBS,
  runExpirySweep,
  runExpiryReminder,
  runLowBalanceWarning,
};
