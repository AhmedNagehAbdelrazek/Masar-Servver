"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.boot = boot;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const worker_threads_1 = require("worker_threads");
const database_1 = require("../config/database");
const scheduler_1 = require("./scheduler");
const index_1 = require("./index");
async function boot() {
    await database_1.initDatabase({ runMigrations: false });
    const tasks = (0, scheduler_1.scheduleJobs)(index_1.JOBS, { catchUp: process.env.JOB_CATCH_UP !== 'false' });
    if (worker_threads_1.parentPort) {
        worker_threads_1.parentPort.postMessage({ type: 'started', jobs: Object.keys(tasks) });
    }
    return tasks;
}
if (require.main === module || !worker_threads_1.isMainThread) {
    boot().catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[jobs] worker boot failed:', msg);
        process.exit(1);
    });
}
exports.default = { boot };
module.exports = { boot };
//# sourceMappingURL=worker.js.map