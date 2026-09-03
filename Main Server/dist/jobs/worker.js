"use strict";
require('dotenv').config();
const { parentPort, isMainThread } = require('worker_threads');
const { initDatabase } = require('../config/database');
const { scheduleJobs } = require('./scheduler');
const { JOBS } = require('./index');
/**
 * Job scheduler worker (T050).
 *
 * Runs on a dedicated worker thread so node-cron's timers live on their own
 * event loop and are never starved by blocking work in the API process.
 *
 * Can also be launched standalone with `node jobs/worker.js` when the jobs
 * must live in a completely separate process instead.
 */
async function boot() {
    await initDatabase({ runMigrations: false });
    const tasks = scheduleJobs(JOBS, { catchUp: process.env.JOB_CATCH_UP !== 'false' });
    if (parentPort) {
        parentPort.postMessage({ type: 'started', jobs: Object.keys(tasks) });
    }
    return tasks;
}
// Boot when run as the worker entry (worker thread) or standalone via the CLI.
if (require.main === module || !isMainThread) {
    boot().catch((err) => {
        console.error('[jobs] worker boot failed:', err);
        process.exit(1);
    });
}
module.exports = { boot };
//# sourceMappingURL=worker.js.map