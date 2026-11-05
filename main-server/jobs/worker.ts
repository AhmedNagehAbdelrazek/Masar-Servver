import dotenv from 'dotenv';
dotenv.config();
import { parentPort, isMainThread } from 'worker_threads';
import { initDatabase } from '../config/database';
import { scheduleJobs } from './scheduler';
import { JOBS } from './index';

async function boot(): Promise<Record<string, unknown>> {
  await (initDatabase as unknown as (opts: { runMigrations: boolean }) => Promise<unknown>)({ runMigrations: false });
  const tasks = scheduleJobs(JOBS as unknown as Record<string, { schedule: string; task: (ctx?: unknown) => Promise<unknown> }>, { catchUp: process.env.JOB_CATCH_UP !== 'false' });
  if (parentPort) {
    parentPort.postMessage({ type: 'started', jobs: Object.keys(tasks) });
  }
  return tasks as unknown as Record<string, unknown>;
}

if (require.main === module || !isMainThread) {
  boot().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[jobs] worker boot failed:', msg);
    process.exit(1);
  });
}

export { boot };
export default { boot };
module.exports = { boot };
