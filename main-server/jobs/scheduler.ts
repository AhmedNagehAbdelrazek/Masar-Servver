import cron from 'node-cron';
import { getKey, setKey } from '../config/redis';

const LAST_RUN_KEY_PREFIX: string = 'jobs:lastrun:';
const LAST_RUN_TTL_SECONDS: number = 3 * 24 * 60 * 60;
const DEFAULT_BACKSCAN_MS: number = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_MISS_TOLERANCE_MS: number = 5 * 60 * 1000;
const DEFAULT_MAX_CATCH_UP: number = 3;
const STEP_MS: number = 60 * 1000;

function lastRunKey(name: string): string {
  return `${LAST_RUN_KEY_PREFIX}${name}`;
}

function configInt(envName: string, fallback: number): number {
  const n: number = parseInt(process.env[envName] as string, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function missToleranceMs(): number {
  return configInt('JOB_MISS_TOLERANCE_MS', DEFAULT_MISS_TOLERANCE_MS);
}

function maxCatchUpRuns(): number {
  return configInt('JOB_MAX_CATCH_UP', DEFAULT_MAX_CATCH_UP);
}

async function getLastRun(name: string): Promise<Date | null> {
  const iso: string | null = await getKey(lastRunKey(name));
  return iso ? new Date(iso) : null;
}

async function recordLastRun(name: string, date: Date = new Date()): Promise<void> {
  await setKey(lastRunKey(name), date.toISOString(), LAST_RUN_TTL_SECONDS);
}

function wrapTask(name: string, taskFn: (ctx?: unknown) => Promise<unknown>): (ctx?: unknown) => Promise<unknown | undefined> {
  let running = false;
  return async function run(context?: unknown): Promise<unknown | undefined> {
    if (running) {
      console.warn(`[jobs] ${name}: previous run still in progress, skipping this tick`);
      return undefined;
    }
    running = true;
    try {
      const result: unknown = await taskFn(context);
      await recordLastRun(name);
      return result;
    } finally {
      running = false;
    }
  };
}

function* scanMissedSlots(task: { match: (d: Date) => boolean }, fromMs: number, toMs: number): Generator<number> {
  const snapped: Date = new Date(toMs);
  snapped.setSeconds(0, 0);
  for (let t: number = snapped.getTime() - STEP_MS; t >= fromMs; t -= STEP_MS) {
    if (task.match(new Date(t))) yield t;
  }
}

function findMissedSlots(task: { match: (d: Date) => boolean }, opts: { fromMs: number; toMs: number; toleranceMs: number }): Date[] {
  const missed: Date[] = [];
  for (const t of scanMissedSlots(task, opts.fromMs, opts.toMs)) {
    if (opts.toMs - t >= opts.toleranceMs) missed.push(new Date(t));
  }
  missed.reverse();
  return missed;
}

async function runCatchUp(task: { match: (d: Date) => boolean; execute: () => Promise<void> }, name: string): Promise<number> {
  const lastRun: Date | null = await getLastRun(name);
  const now: number = Date.now();
  const fromMs: number = lastRun ? lastRun.getTime() + STEP_MS : now - DEFAULT_BACKSCAN_MS;
  const slots: Date[] = findMissedSlots(task, { fromMs, toMs: now, toleranceMs: missToleranceMs() });
  const toRun: Date[] = slots.slice(-maxCatchUpRuns());

  for (const slot of toRun) {
    console.warn(`[jobs] ${name}: missed run at ${slot.toISOString()}, executing now`);
    try {
      await task.execute();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[jobs] ${name} catch-up failed:`, msg);
    }
  }
  return toRun.length;
}

interface JobEntry {
  schedule: string;
  task: (ctx?: unknown) => Promise<unknown>;
}

function scheduleJobs(jobRegistry: Record<string, JobEntry>, opts: { catchUp?: boolean } = {}): Record<string, ReturnType<typeof cron.schedule>> {
  const timezone: string | undefined =
    process.env.JOB_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  const tasks: Record<string, ReturnType<typeof cron.schedule>> = {};

  for (const [name, { schedule, task }] of Object.entries(jobRegistry)) {
    if (!schedule || schedule === 'off') continue;

    const cronTask = cron.schedule(schedule, wrapTask(name, task), {
      name,
      timezone,
      noOverlap: true,
    } as unknown as Parameters<typeof cron.schedule>[2]);

    (cronTask as unknown as { on: (e: string, cb: (ctx: { date?: Date }) => void) => void }).on('execution:missed', (context: { date?: Date }) => {
      const slot = context && context.date;
      console.warn(
        `[jobs] ${name}: missed run at ${slot ? slot.toISOString() : 'unknown'}, executing now`
      );
      (cronTask as unknown as { execute: () => Promise<void> }).execute().catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[jobs] ${name} missed-run retry failed:`, msg);
      });
    });

    if (opts.catchUp) {
      runCatchUp(cronTask as unknown as { match: (d: Date) => boolean; execute: () => Promise<void> }, name).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[jobs] ${name} startup catch-up failed:`, msg);
      });
    }

    console.log(`[jobs] scheduled ${name} at "${schedule}"${timezone ? ` (${timezone})` : ''}`);
    tasks[name] = cronTask;
  }

  return tasks;
}

export { scheduleJobs, wrapTask, findMissedSlots, runCatchUp, getLastRun, recordLastRun };
export default { scheduleJobs, wrapTask, findMissedSlots, runCatchUp, getLastRun, recordLastRun };
module.exports = {
  scheduleJobs,
  wrapTask,
  findMissedSlots,
  runCatchUp,
  getLastRun,
  recordLastRun,
};
