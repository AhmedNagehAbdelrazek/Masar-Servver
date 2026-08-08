"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIngestRouter = createIngestRouter;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../auth");
const config_1 = require("../config");
function createIngestRouter(pool, queue) {
    const router = express_1.default.Router();
    // Use express.raw() to capture the body as a Buffer — this preserves
    // the raw bytes for HMAC verification AND doesn't consume the stream
    // before JSON parsing.
    router.post('/v1/audit/ingest', express_1.default.raw({ type: 'application/json', limit: config_1.config.ingestion.maxBatchBytes }), async (req, res) => {
        try {
            const rawBody = req.body.toString('utf8');
            const service = await (0, auth_1.verifyAuditRequest)({
                pool,
                serviceId: req.headers['x-audit-service-id'],
                clientKey: req.headers['x-audit-client-key'],
                timestamp: req.headers['x-audit-timestamp'],
                signature: req.headers['x-audit-signature'],
                rawBody,
            });
            let payload;
            try {
                payload = JSON.parse(rawBody);
            }
            catch {
                res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Body is not valid JSON' } });
                return;
            }
            await queue.add({
                service,
                events: payload.events ?? [],
                spans: payload.spans ?? [],
            });
            res.status(202).json({ accepted: true });
        }
        catch (err) {
            console.error('[audit-server] ingest error', err.message);
            res.status(401).json({
                error: { code: 'UNAUTHORIZED', message: 'Audit ingestion rejected' },
            });
        }
    });
    return router;
}
//# sourceMappingURL=ingestion.js.map