"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueryRouter = createQueryRouter;
const express_1 = __importDefault(require("express"));
function createQueryRouter(pool) {
    const router = express_1.default.Router();
    router.get('/v1/traces/:traceId', async (req, res) => {
        try {
            const result = await pool.query(`
        WITH RECURSIVE trace_tree AS (
          SELECT
            span_id, parent_span_id, service_name, name, kind,
            start_time, end_time, duration_ms, status_code, status,
            caller_service, target_service, 0 AS depth
          FROM audit.trace_spans
          WHERE trace_id = $1 AND parent_span_id IS NULL

          UNION ALL

          SELECT
            s.span_id, s.parent_span_id, s.service_name, s.name, s.kind,
            s.start_time, s.end_time, s.duration_ms, s.status_code, s.status,
            s.caller_service, s.target_service, t.depth + 1
          FROM audit.trace_spans s
          JOIN trace_tree t ON s.parent_span_id = t.span_id
          WHERE s.trace_id = $1
        )
        SELECT * FROM trace_tree ORDER BY start_time;
        `, [req.params.traceId]);
            res.json({ trace_id: req.params.traceId, spans: result.rows });
        }
        catch (err) {
            console.error('[audit-server] trace query error', err.message);
            res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to query trace' } });
        }
    });
    router.get('/v1/audit/events', async (req, res) => {
        try {
            let sql = `SELECT * FROM audit.events WHERE 1=1`;
            const params = [];
            let idx = 1;
            if (req.query.actor_id) {
                sql += ` AND actor_id = $${idx++}`;
                params.push(req.query.actor_id);
            }
            if (req.query.action) {
                sql += ` AND action = $${idx++}`;
                params.push(req.query.action);
            }
            if (req.query.service_name) {
                sql += ` AND service_name = $${idx++}`;
                params.push(req.query.service_name);
            }
            if (req.query.from) {
                sql += ` AND event_time >= $${idx++}`;
                params.push(req.query.from);
            }
            if (req.query.to) {
                sql += ` AND event_time <= $${idx++}`;
                params.push(req.query.to);
            }
            if (req.query.trace_id) {
                sql += ` AND trace_id = $${idx++}`;
                params.push(req.query.trace_id);
            }
            sql += ` ORDER BY event_time DESC LIMIT $${idx++}`;
            params.push(parseInt(req.query.limit) || 100);
            const result = await pool.query(sql, params);
            res.json({ count: result.rows.length, events: result.rows });
        }
        catch (err) {
            console.error('[audit-server] event query error', err.message);
            res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to query events' } });
        }
    });
    return router;
}
//# sourceMappingURL=query.js.map