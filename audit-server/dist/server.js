"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./db"));
const config_1 = require("./config");
const initDb_1 = require("./initDb");
const queue_1 = require("./queue");
const worker_1 = require("./worker");
const ingestion_1 = require("./routes/ingestion");
const query_1 = require("./routes/query");
const admin_1 = require("./routes/admin");
const health_1 = require("./routes/health");
async function start() {
    await (0, initDb_1.ensureDatabase)();
    await (0, initDb_1.migrate)();
    const app = (0, express_1.default)();
    app.set('trust proxy', true);
    const queue = new queue_1.InMemoryAuditQueue({
        flushFn: async (payloads) => {
            await (0, worker_1.insertAuditBatch)(db_1.default, payloads);
        },
        bufferSize: config_1.config.ingestion.bufferSize,
        flushIntervalMs: config_1.config.ingestion.flushIntervalMs,
    });
    app.use((0, health_1.createHealthRouter)());
    app.use((0, ingestion_1.createIngestRouter)(db_1.default, queue));
    app.use((0, query_1.createQueryRouter)(db_1.default));
    app.use((0, admin_1.createAdminRouter)(db_1.default));
    const server = app.listen(config_1.config.port, () => {
        console.log(`[audit-server] listening on port ${config_1.config.port}`);
    });
    async function shutdown() {
        console.log('[audit-server] shutting down...');
        server.close();
        await queue.close();
        await db_1.default.end();
        process.exit(0);
    }
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    return app;
}
start().catch((err) => {
    console.error('[audit-server] failed to start:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map